import express from "express";
import axios from "axios";
import { getMpesaToken } from "./mpesa.js";
import { createClient } from "@supabase/supabase-js";

const b2c = express.Router();

// Initialize Supabase with service role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SEND B2C PAYMENT REQUEST


b2c.post("/send", async (req, res) => {
  try {
    const { loan_id, customer_id, msisdn, amount } = req.body;

    if (!amount || !msisdn)
      return res.status(400).json({ error: "Missing required fields" });

    const token = await getMpesaToken();
    const url = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";

    // ✅ Log payload (for debugging)
    console.log("📤 Sending B2C Payload:", {
      InitiatorName: process.env.MPESA_INITIATOR,
      SecurityCredential:
        process.env.MPESA_SECURITY_CREDENTIAL?.substring(0, 10) + "...",
      CommandID: "BusinessPayment",
      Amount: amount,
      PartyA: process.env.MPESA_SHORTCODE,
      PartyB: msisdn,
      QueueTimeOutURL: `${process.env.CALLBACK_URL}/mpesa/b2c/timeout`,
      ResultURL: `${process.env.CALLBACK_URL}/mpesa/b2c/result`,
    });

    const { data } = await axios.post(
      url,
      {
        InitiatorName: process.env.MPESA_INITIATOR,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: "BusinessPayment",
        Amount: amount,
        PartyA: process.env.MPESA_SHORTCODE,
        PartyB: msisdn,
        Remarks: "Loan Disbursement",
        QueueTimeOutURL: `${process.env.CALLBACK_URL}/mpesa/b2c/timeout`,
        ResultURL: `${process.env.CALLBACK_URL}/mpesa/b2c/result`,
        Occasion: "Loan",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // ✅ Insert transaction into database
    const { error: insertError } = await supabaseAdmin
      .from("mpesa_b2c_transactions")
      .insert([
        {
          loan_id: loan_id || null,
          customer_id: customer_id || null,
          phone_number: msisdn,
          amount,
          transaction_id: data?.ConversationID || null,
          transaction_time: new Date().toISOString(),
          status: "pending",
          raw_payload: data,
        },
      ]);

    if (insertError) throw insertError;

    res.json({
      message: "B2C request sent successfully and logged to DB.",
      data,
    });
  } catch (err) {
    console.error("❌ B2C Send Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});




// HANDLE B2C RESULT CALLBACK
b2c.post("/result", async (req, res) => {
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = body.Result || body;

    console.log("📩 B2C Result Received:", JSON.stringify(result, null, 2));

    if (!result || typeof result.ResultCode === "undefined") {
      return res.status(400).json({ error: "Invalid callback payload" });
    }
  try {
    // Extract parameters
    const params = result.ResultParameters?.ResultParameter || [];
    const details = params.reduce((acc, p) => {
      acc[p.Key] = p.Value;
      return acc;
    }, {});

    // Use both ConversationID and TransactionID
    const conversationId = result.ConversationID;
    const transactionId =
      details.TransactionReceipt ||
      result.TransactionID ||
      conversationId;

    const amount = details.TransactionAmount || null;
    const status = result.ResultCode === 0 ? "success" : "failed";
    const failureReason = result.ResultDesc || null;

    //  Step 1: Update the mpesa_b2c_transactions table
    const { data: existingTx, error: fetchError } = await supabaseAdmin
      .from("mpesa_b2c_transactions")
      .select("loan_id")
      .eq("transaction_id", transactionId)
      .single();

    if (fetchError) throw fetchError;
    const loanId = existingTx?.loan_id;

    const { error: updateError } = await supabaseAdmin
      .from("mpesa_b2c_transactions")
      .update({
        status,
        transaction_id: transactionId,
        failure_reason: failureReason,
        transaction_time: new Date().toISOString(),
        raw_payload: req.body,
      })
      .eq("transaction_id", conversationId);

    if (updateError) throw updateError;

    // Step 2: If transaction succeeded, update the loan status to "disbursed"
    if (status === "success" && loanId) {
      const { error: loanUpdateError } = await supabaseAdmin
        .from("loans")
        .update({ status: "disbursed", updated_at: new Date().toISOString() })
        .eq("id", loanId);

      if (loanUpdateError) throw loanUpdateError;
      console.log(` Loan ${loanId} marked as disbursed.`);
    } else if (status === "failed" && loanId) {
      console.log(` Loan ${loanId} remains undisbursed (B2C failed).`);
    }

    console.log(`B2C Transaction ${status}:`, transactionId);

    res.json({ ResultCode: 0, ResultDesc: "Result Received Successfully" });
  } catch (err) {
    console.error(" Error processing B2C result:", err.message);
    res.status(500).json({ error: err.message });
  }
});





// TIMEOUT HANDLER

b2c.post("/timeout", async (req, res) => {
  console.log("⚠️ B2C Timeout Received:", req.body);

  try {
    const { error } = await supabaseAdmin
      .from("mpesa_b2c_transactions")
      .update({
        status: "failed",
        raw_payload: req.body,
      })
      .eq("status", "pending");

    if (error) throw error;

    res.json({ ResultCode: 0, ResultDesc: "Timeout Logged Successfully" });
  } catch (err) {
    console.error("❌ Timeout Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default b2c;
