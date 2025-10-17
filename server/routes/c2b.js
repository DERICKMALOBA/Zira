import express from "express";
import axios from "axios";
import { getMpesaToken } from "./mpesa.js";
import { createClient } from "@supabase/supabase-js";

const c2b = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


// REGISTER CALLBACK URLs

c2b.get("/register", async (req, res) => {
  try {
    const token = await getMpesaToken();
    const url = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl";

    const { data } = await axios.post(
      url,
      {
        ShortCode: process.env.MPESA_SHORTCODE,
        ResponseType: "Completed",
        ConfirmationURL: `${process.env.CALLBACK_URL}/mpesa/c2b/confirmation`,
        ValidationURL: `${process.env.CALLBACK_URL}/mpesa/c2b/validation`,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ C2B URL Registration:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ C2B Registration Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2 VALIDATION URL (Optional)

c2b.post("/validation", (req, res) => {
  console.log(" C2B Validation Payload:", req.body);
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});


// CONFIRMATION LOGIC

c2b.post("/confirmation", async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { TransID, TransAmount, MSISDN, BillRefNumber, TransTime } = body;

    if (!TransID || !MSISDN || !TransAmount || !BillRefNumber)
      throw new Error("Missing required transaction fields.");

    const totalPaidAmount = parseFloat(TransAmount);
    const transaction_time = new Date().toISOString();

    //  Determine payment type and IDs
    let paymentType = "repayment";
    let loanId = null;
    let customerId = null;

    if (BillRefNumber.startsWith("registration-")) {
      paymentType = "registration";
      customerId = BillRefNumber.split("-")[1];
    } else if (BillRefNumber.startsWith("processing-")) {
      paymentType = "processing";
      loanId = BillRefNumber.split("-")[1];
    } else {
      // Default: assume numeric loan_id
      loanId = parseInt(BillRefNumber.trim());
    }

    console.log(` C2B Confirmation Received: ${paymentType} | MSISDN: ${MSISDN}`);

    //  Avoid duplicates
    const { data: existingTx } = await supabaseAdmin
      .from("mpesa_c2b_transactions")
      .select("id")
      .eq("transaction_id", TransID)
      .maybeSingle();

    if (existingTx) {
      console.log(` Duplicate transaction ${TransID} ignored.`);
      return res.json({ ResultCode: 0, ResultDesc: "Duplicate transaction" });
    }

    // Save transaction
    const { error: insertError } = await supabaseAdmin
      .from("mpesa_c2b_transactions")
      .insert([
        {
          transaction_id: TransID,
          phone_number: MSISDN,
          amount: totalPaidAmount,
          transaction_time,
          raw_payload: body,
          status: "pending",
          loan_id: loanId || null,
          payment_type: paymentType,
        },
      ]);

    if (insertError) throw insertError;

    // Handle by payment type
    if (paymentType === "registration") {
      console.log(` Registration fee received for customer ${customerId}`);

      await supabaseAdmin
        .from("customers")
        .update({ registration_fee_paid: true })
        .eq("id", customerId);

      await supabaseAdmin
        .from("mpesa_c2b_transactions")
        .update({ status: "applied" })
        .eq("transaction_id", TransID);

      return res.json({
        ResultCode: 0,
        ResultDesc: "Registration fee processed successfully",
      });
    }

    if (paymentType === "processing") {
      console.log(` Processing fee received for loan ${loanId}`);

      await supabaseAdmin
        .from("loans")
        .update({
          processing_fee_paid: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", loanId);

      await supabaseAdmin
        .from("mpesa_c2b_transactions")
        .update({ status: "applied" })
        .eq("transaction_id", TransID);

      return res.json({
        ResultCode: 0,
        ResultDesc: "Processing fee processed successfully",
      });
    }

    //  Default: Loan Repayment
    if (!loanId) throw new Error("Missing loan ID for repayment.");

    console.log(` Processing loan repayment for loan ${loanId}`);

    let remainingAmount = totalPaidAmount;
    const appliedPayments = [];

    const { data: installments, error: fetchError } = await supabaseAdmin
      .from("loan_installments")
      .select("*")
      .eq("loan_id", loanId)
      .in("status", ["pending", "partial"])
      .order("installment_number", { ascending: true });

    if (fetchError) throw fetchError;
    if (!installments?.length) {
      console.log(`No pending installments for loan ${loanId}`);
      return res.json({
        ResultCode: 0,
        ResultDesc: "No pending installments for this loan",
      });
    }

    for (const inst of installments) {
      if (remainingAmount <= 0) break;
      const installmentId = inst.id;
      const oldPaid = parseFloat(inst.paid_amount || 0);
      const dueAmount = parseFloat(inst.due_amount);
      const amountNeeded = dueAmount - oldPaid;

      const appliedAmount = Math.min(remainingAmount, amountNeeded);
      const newPaid = oldPaid + appliedAmount;
      const newStatus = newPaid >= dueAmount ? "paid" : "partial";

      const { error: updateError } = await supabaseAdmin
        .from("loan_installments")
        .update({
          paid_amount: newPaid,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", installmentId);

      if (updateError) throw updateError;

      await supabaseAdmin.from("loan_payments").insert([
        {
          loan_id: loanId,
          installment_id: installmentId,
          paid_amount: appliedAmount,
          balance_before: oldPaid,
          balance_after: newPaid,
          mpesa_receipt: TransID,
          phone_number: MSISDN,
          payment_method: "mpesa_c2b",
        },
      ]);

      appliedPayments.push({
        installment_number: inst.installment_number,
        applied: appliedAmount,
      });

      remainingAmount -= appliedAmount;
    }

    await supabaseAdmin
      .from("mpesa_c2b_transactions")
      .update({
        status: "applied",
        applied_amount: totalPaidAmount - remainingAmount,
      })
      .eq("transaction_id", TransID);

    console.log(`Loan repayment processed for loan ${loanId}`);

    res.json({
      ResultCode: 0,
      ResultDesc: "Loan repayment processed successfully",
    });
  } catch (error) {
    console.error(" C2B Confirmation Error:", error.message);
    res.json({
      ResultCode: 1,
      ResultDesc: `Processing failed: ${error.message}`,
    });
  }
});

export default c2b;
