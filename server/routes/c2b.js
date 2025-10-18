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
    const { TransID, TransAmount, MSISDN, BillRefNumber } = body;

    if (!TransID || !MSISDN || !TransAmount || !BillRefNumber)
      throw new Error("Missing required transaction fields.");

    const totalPaidAmount = parseFloat(TransAmount);
    const transaction_time = new Date().toISOString();

    // Determine payment type and IDs
    let paymentType = "repayment";
    let loanId = null;
    let customerId = null;

    // 🔹 Detect payment category based on BillRefNumber
    if (BillRefNumber === "registration_fee") {
      paymentType = "registration";
    } else if (BillRefNumber.startsWith("loan_")) {
      paymentType = "processing";
      loanId = BillRefNumber.split("_")[1];
    } else if (BillRefNumber.startsWith("registration-")) {
      paymentType = "registration";
      customerId = BillRefNumber.split("-")[1];
    } else if (BillRefNumber.startsWith("processing-")) {
      paymentType = "processing";
      loanId = BillRefNumber.split("-")[1];
    } else {
      loanId = parseInt(BillRefNumber.trim());
    }

    console.log(`📥 C2B Confirmation Received: ${paymentType} | MSISDN: ${MSISDN}`);

    // Prevent duplicate transactions
    const { data: existingTx } = await supabaseAdmin
      .from("mpesa_c2b_transactions")
      .select("id")
      .eq("transaction_id", TransID)
      .maybeSingle();

    if (existingTx) {
      console.log(`⚠️ Duplicate transaction ${TransID} ignored.`);
      return res.json({ ResultCode: 0, ResultDesc: "Duplicate transaction" });
    }

    // Store transaction
    await supabaseAdmin.from("mpesa_c2b_transactions").insert([
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

    // 🟢 Handle Registration Fee Payment
    if (paymentType === "registration") {
      console.log(`✅ Registration fee received from ${MSISDN}`);

      // Find customer by phone
      const { data: customer, error: customerError } = await supabaseAdmin
        .from("customers")
        .select("id, registration_fee_paid, is_new_customer")
        .eq("mobile", MSISDN)
        .single();

      if (customerError || !customer) throw new Error("Customer not found");

      // Update registration payment + mark as not new
      await supabaseAdmin
        .from("customers")
        .update({
          registration_fee_paid: true,
          is_new_customer: false,
        })
        .eq("id", customer.id);

      // Mark transaction as applied
      await supabaseAdmin
        .from("mpesa_c2b_transactions")
        .update({ status: "applied" })
        .eq("transaction_id", TransID);

      return res.json({
        ResultCode: 0,
        ResultDesc: "Registration fee processed successfully",
      });
    }

    // 🟡 Handle Processing Fee Payment
    if (paymentType === "processing") {
      console.log(`✅ Processing fee received for loan ${loanId}`);

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

    // 🧾 Default: Loan Repayment Logic
    if (!loanId) throw new Error("Missing loan ID for repayment.");

    console.log(`💰 Processing loan repayment for loan ${loanId}`);

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
      console.log(`ℹ️ No pending installments for loan ${loanId}`);
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

      await supabaseAdmin
        .from("loan_installments")
        .update({
          paid_amount: newPaid,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", installmentId);

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

    console.log(`✅ Loan repayment processed for loan ${loanId}`);
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
