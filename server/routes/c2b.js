import express from "express";
import axios from "axios";
import { getMpesaToken } from "./mpesa.js";
import { createClient } from "@supabase/supabase-js";

const c2b = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==========================
// 1️⃣ REGISTER CALLBACK URLs
// ==========================
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

// ==========================
// 2️⃣ VALIDATION URL (Optional)
// ==========================
c2b.post("/validation", (req, res) => {
  console.log("🧩 C2B Validation Payload:", req.body);
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

c2b.post("/confirmation", async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { TransID, TransAmount, MSISDN, BillRefNumber } = body;
    const loanId = parseInt(BillRefNumber?.trim());

    if (!loanId) throw new Error("Missing or invalid BillRefNumber (loan_id)");

    const totalPaidAmount = parseFloat(TransAmount);
    let remainingAmount = totalPaidAmount;
    const appliedPayments = []; // Track all applied payments for rollback if needed

    console.log(`💰 Processing payment: ${TransAmount} for Loan ${loanId}`);

    // Get all pending or partial installments upfront
    const { data: installmentsToPay, error: fetchError } = await supabaseAdmin
      .from("loan_installments")
      .select("*")
      .eq("loan_id", loanId)
      .in("status", ["pending", "partial"])
      .order("installment_number", { ascending: true });

    if (fetchError) throw fetchError;

    if (!installmentsToPay || installmentsToPay.length === 0) {
      console.log(`⚠️ No pending installments found for Loan ${loanId}`);
      // Still record the transaction but mark as "pending"
      await supabaseAdmin.from("mpesa_c2b_transactions").insert([
        {
          transaction_id: TransID,
          phone_number: MSISDN,
          amount: totalPaidAmount,
          transaction_time: new Date().toISOString(),
          raw_payload: body,
          status: "pending",
          loan_id: loanId,
          applied_amount: 0,
        },
      ]);
      
      return res.json({ 
        ResultCode: 0, 
        ResultDesc: "No pending installments to apply payment to" 
      });
    }

    // Process each installment
    for (const installment of installmentsToPay) {
      if (remainingAmount <= 0) break;

      const installmentId = installment.id;
      const oldPaid = parseFloat(installment.paid_amount || 0);
      const dueAmount = parseFloat(installment.due_amount);
      const amountNeeded = dueAmount - oldPaid;

      const appliedAmount = Math.min(remainingAmount, amountNeeded);
      const newPaid = oldPaid + appliedAmount;
      const newStatus = newPaid >= dueAmount ? "paid" : "partial";

      // Update installment
      const { error: updateError } = await supabaseAdmin
        .from("loan_installments")
        .update({
          paid_amount: newPaid,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", installmentId)
        .select();

      if (updateError) throw updateError;

      // Record payment in loan_payments
      const { error: paymentError } = await supabaseAdmin
        .from("loan_payments")
        .insert([
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

      if (paymentError) throw paymentError;

      appliedPayments.push({
        installment_number: installment.installment_number,
        applied: appliedAmount,
        new_status: newStatus,
      });

      remainingAmount -= appliedAmount;

      console.log(
        `✅ Applied ${appliedAmount} to Installment #${installment.installment_number} (${newStatus})`
      );
    }

    // Save the main transaction record (once)
    const transactionStatus = "applied"; // Using existing status from your constraint

    const { error: txError } = await supabaseAdmin
      .from("mpesa_c2b_transactions")
      .insert([
        {
          transaction_id: TransID,
          phone_number: MSISDN,
          amount: totalPaidAmount,
          transaction_time: new Date().toISOString(),
          raw_payload: body,
          status: transactionStatus,
          loan_id: loanId,
          installment_id: appliedPayments.length > 0 ? installmentsToPay[0].id : null,
          applied_amount: totalPaidAmount - remainingAmount,
        },
      ]);

    if (txError) throw txError;

    // Update loan repayment_state
    const { data: allInstallments } = await supabaseAdmin
      .from("loan_installments")
      .select("status, due_date")
      .eq("loan_id", loanId);

    if (allInstallments?.length > 0) {
      let repaymentState = "ongoing";
      const allPaid = allInstallments.every((inst) => inst.status === "paid");
      const anyPartial = allInstallments.some((inst) => inst.status === "partial");
      const anyOverdue = allInstallments.some(
        (inst) => inst.status !== "paid" && new Date(inst.due_date) < new Date()
      );

      if (allPaid) repaymentState = "completed";
      else if (anyPartial) repaymentState = "partial";
      else if (anyOverdue) repaymentState = "overdue";

      const { error: loanUpdateError } = await supabaseAdmin
        .from("loans")
        .update({ 
          repayment_state: repaymentState, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", loanId);

      if (loanUpdateError) throw loanUpdateError;

      console.log(`🔔 Loan ${loanId} repayment_state updated to ${repaymentState}`);
    }

    // Log summary
    const summary = {
      total_paid: totalPaidAmount,
      applied_amount: totalPaidAmount - remainingAmount,
      excess_amount: remainingAmount,
      installments_affected: appliedPayments.length,
      details: appliedPayments,
    };

    console.log(`📊 Payment Summary:`, JSON.stringify(summary, null, 2));

    if (remainingAmount > 0) {
      console.log(`⚠️ Overpayment: ${remainingAmount} remains unapplied`);
    }

    res.json({ 
      ResultCode: 0, 
      ResultDesc: "Payment processed successfully",
      // Note: M-Pesa only expects ResultCode and ResultDesc, but logging this internally is useful
    });
  } catch (err) {
    console.error("❌ C2B Confirmation Error:", err.message);
    console.error("Stack:", err.stack);
    
    // Even on error, we must respond with valid M-Pesa format
    // to avoid transaction retry
    res.json({ 
      ResultCode: 1, 
      ResultDesc: `Processing failed: ${err.message}` 
    });
  }
});







export default c2b;
