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

    console.log(" C2B URL Registration:", data);
    res.json(data);
  } catch (err) {
    console.error(" C2B Registration Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2 VALIDATION URL (Optional)

c2b.post("/validation", (req, res) => {
  console.log(" C2B Validation Payload:", req.body);
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

c2b.post("/confirmation", async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { TransID, TransAmount, MSISDN, BillRefNumber } = body;
    let localNumber = MSISDN.replace(/^254/, "0");

    if (!TransID || !MSISDN || !TransAmount || !BillRefNumber)
      throw new Error("Missing required transaction fields.");

    const totalPaidAmount = parseFloat(TransAmount);
    const transaction_time = new Date().toISOString();

    let paymentType = "repayment";
    let description = "Loan Repayment";
    let loanId = null;
    let customerId = null;

    // Identify payment category
    if (BillRefNumber === "registration_fee") {
      paymentType = "registration";
      description = "Joining Fee Payment";
    } else if (BillRefNumber.startsWith("registration-")) {
      paymentType = "registration";
      description = "Joining Fee Payment";
      customerId = BillRefNumber.split("-")[1];
    } else if (BillRefNumber.startsWith("processing-")) {
      paymentType = "processing";
      description = "Loan Processing Fee";
      loanId = BillRefNumber.split("-")[1];
    } else {
      loanId = parseInt(BillRefNumber.trim());
    }

    // Prevent duplicate transactions
    const { data: existingTx } = await supabaseAdmin
      .from("mpesa_c2b_transactions")
      .select("id")
      .eq("transaction_id", TransID)
      .maybeSingle();

    if (existingTx) {
      console.log(`Duplicate transaction ${TransID} ignored.`);
      return res.json({ ResultCode: 0, ResultDesc: "Duplicate transaction" });
    }

    // Log the raw transaction first
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
        description,
        reference: TransID,
      },
    ]);


    // handle suspense account for unmatched customers
let customerMatched = false;

if (paymentType === "repayment") {
  // Attempt to find the customer using BillRefNumber or known mappings
  if (loanId) {
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("id", loanId) // or link to loan table if loanId exists
      .maybeSingle();

    if (!customer) {
      // Customer not found: move to suspense
      await supabaseAdmin.from("suspense_transactions").insert([{
        payer_name: "Unknown", // optionally accept from body if provided
        phone_number: MSISDN,
        amount: totalPaidAmount,
        transaction_id: TransID,
        transaction_time,
        status: "suspense",
      }]);

      return res.json({
        ResultCode: 0,
        ResultDesc: "Payment moved to suspense account for manual resolution",
      });
    } else {
      customerMatched = true;
      customerId = customer.id;
    }
  }
}


    // Handle joining or processing payments
    if (paymentType === "registration") {
      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("id")
        .in("mobile", [MSISDN, localNumber])
        .single();

      if (!customer) throw new Error("Customer not found");

      await supabaseAdmin
        .from("customers")
        .update({ registration_fee_paid: true, is_new_customer: false })
        .eq("id", customer.id);

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

    // Loan repayment starts here
    if (!loanId) throw new Error("Missing loan ID for repayment.");

    console.log(`Processing loan repayment for loan ${loanId}`);

    let remainingAmount = totalPaidAmount;

    // Fetch installments
    const { data: installments, error: fetchError } = await supabaseAdmin
      .from("loan_installments")
      .select("*")
      .eq("loan_id", loanId)
      .in("status", ["pending", "partial"])
      .order("installment_number", { ascending: true });

    if (fetchError) throw fetchError;
    if (!installments?.length)
      return res.json({ ResultCode: 0, ResultDesc: "No pending installments" });

    for (const inst of installments) {
      if (remainingAmount <= 0) break;

      const installmentId = inst.id;
      const interestDue = parseFloat(inst.interest_due ?? inst.interest_amount);
      const principalDue = parseFloat(inst.principal_due ?? inst.principal_amount);
      const interestPaid = parseFloat(inst.interest_paid ?? 0);
      const principalPaid = parseFloat(inst.principal_paid ?? 0);

      const balanceBefore = interestDue + principalDue - (interestPaid + principalPaid);
      

      let descriptionPart = "";
      let principalToPay = 0;
      let interestToPay = 0;

      // Pay interest first
      interestToPay = Math.min(remainingAmount, interestDue - interestPaid);
      if (interestToPay > 0) {
        remainingAmount -= interestToPay;

        await supabaseAdmin.from("loan_payments").insert([
          {
            loan_id: loanId,
            installment_id: installmentId,
            paid_amount: interestToPay,
            payment_type: "interest",
            description: "Interest Repayment",
            mpesa_receipt: TransID,
            phone_number: MSISDN,
            payment_method: "mpesa_c2b",
            balanceBefore,
            balance_after: balanceBefore - interestToPay,
          },
        ]);

        await supabaseAdmin
          .from("loan_installments")
          .update({
            interest_paid: interestPaid + interestToPay,
            updated_at: new Date().toISOString(),
          })
          .eq("id", installmentId);
      }

      // Then pay principal
      principalToPay = Math.min(remainingAmount, principalDue - principalPaid);
      if (principalToPay > 0) {
        remainingAmount -= principalToPay;

        await supabaseAdmin.from("loan_payments").insert([
          {
            loan_id: loanId,
            installment_id: installmentId,
            paid_amount: principalToPay,
            payment_type: "principal",
            description: "Principal Repayment",
            mpesa_receipt: TransID,
            phone_number: MSISDN,
            payment_method: "mpesa_c2b",
           balanceBefore,
            balance_after: balanceBefore - (interestToPay + principalToPay),
          },
        ]);

        await supabaseAdmin
          .from("loan_installments")
          .update({
            principal_paid: principalPaid + principalToPay,
            updated_at: new Date().toISOString(),
          })
          .eq("id", installmentId);
      }

      // Update overall installment status
      const totalPaid = interestPaid + principalPaid + interestToPay + principalToPay;
      const totalDue = interestDue + principalDue;
      const fullyPaid = totalPaid >= totalDue;

      await supabaseAdmin
        .from("loan_installments")
        .update({
          paid_amount: totalPaid,
          status: fullyPaid ? "paid" : "partial",
          updated_at: new Date().toISOString(),
        })
        .eq("id", installmentId);
    }

    // Finalize transaction
    await supabaseAdmin
      .from("mpesa_c2b_transactions")
      .update({
        status: "applied",
        applied_amount: totalPaidAmount - remainingAmount,
      })
      .eq("transaction_id", TransID);

    res.json({
      ResultCode: 0,
      ResultDesc: "Loan repayment processed successfully",
    });
  } catch (error) {
    console.error("C2B Confirmation Error:", error.message);
    res.json({
      ResultCode: 1,
      ResultDesc: `Processing failed: ${error.message}`,
    });
  }
});




export default c2b;
