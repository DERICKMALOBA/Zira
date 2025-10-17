import express from "express";
import axios from "axios";
import { getMpesaToken } from "./mpesa.js";
import { createClient } from "@supabase/supabase-js";

const stkpush = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


// 🔹 STK PUSH INITIATION

stkpush.post("/initiate", async (req, res) => {
  try {
    const { phone, amount, accountReference, transactionDesc, customerId, loanId } = req.body;

    if (!phone || !amount || !accountReference) {
      return res.status(400).json({ message: "Missing required fields (phone, amount, accountReference)" });
    }

    const token = await getMpesaToken();
    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    // Generate Timestamp & Password
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    // Format phone number
    let msisdn = phone.toString().replace(/\D/g, "");
    if (msisdn.startsWith("0")) msisdn = "254" + msisdn.substring(1);
    else if (msisdn.startsWith("7")) msisdn = "254" + msisdn;

    // Build STK payload
    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: msisdn,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: msisdn,
      CallBackURL: `${process.env.CALLBACK_URL}/mpesa/stkpush/callback`,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc || "Payment",
    };

    // Send STK Push
    const { data } = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("STK Push Request:", data);

    // Store initial transaction
    await supabaseAdmin.from("mpesa_c2b_transactions").insert([
      {
        transaction_id: data.CheckoutRequestID,
        phone_number: msisdn,
        amount,
        transaction_time: new Date().toISOString(),
        raw_payload: payload,
        status: "initiated",
        payment_type: accountReference,
        loan_id: loanId || null,
        customer_id: customerId || null,
      },
    ]);

    res.status(200).json({
      message: "STK Push initiated successfully",
      data,
    });
  } catch (error) {
    console.error(" STK Push Error:", error.response?.data || error.message);
    res.status(500).json({
      message: "Failed to initiate STK Push",
      error: error.response?.data || error.message,
    });
  }
});


//  STK PUSH CALLBACK HANDLER

stkpush.post("/callback", async (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) throw new Error("Invalid callback payload");

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body;

    // Update transaction status
    const status = ResultCode === 0 ? "success" : "failed";
    const amount = CallbackMetadata?.Item?.find((i) => i.Name === "Amount")?.Value;
    const phone = CallbackMetadata?.Item?.find((i) => i.Name === "PhoneNumber")?.Value;

    await supabaseAdmin
      .from("mpesa_c2b_transactions")
      .update({
        status,
        amount: amount || null,
        phone_number: phone || null,
        transaction_time: new Date().toISOString(),
        raw_payload: body,
      })
      .eq("transaction_id", CheckoutRequestID);

    console.log(`STK Push Callback: ${ResultDesc}`);

    res.json({ ResultCode: 0, ResultDesc: "Received successfully" });
  } catch (error) {
    console.error(" STK Callback Error:", error.message);
    res.json({ ResultCode: 1, ResultDesc: "Callback processing failed" });
  }
});

export default stkpush;
