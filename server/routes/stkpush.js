import express from "express";
import axios from "axios";
import { getMpesaToken } from "./mpesa.js";
import { createClient } from "@supabase/supabase-js";

const stkpush = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


const getCurrentTimestamp = () => {
  const date = new Date();
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
};


//  STK PUSH INITIATION
stkpush.post("/stkpush", async (req, res) => {
  try {
    console.log(" Incoming STK Push request body:", req.body);

    const { amount, phone, accountReference, transactionDesc, loanId, customerId } = req.body;

    // Basic validation
    if (!amount || !phone) {
      console.error(" Missing required fields. Amount or phone is null.");
      return res.status(400).json({ success: false, message: "Amount and phone are required" });
    }

    console.log(` STK Details: 
      Amount: ${amount}
      Phone: ${phone}
      Account Reference: ${accountReference}
      Description: ${transactionDesc}
      Loan ID: ${loanId}
      Customer ID: ${customerId}`);

    // Generate token
    const token = await getMpesaToken();
    console.log(" Access Token Retrieved Successfully");

    // Handle reference types
    let billRef = "general";
    if (accountReference === "REGISTRATION") billRef = `registration-${customerId}`;
    if (accountReference === "PROCESSING") billRef = `processing-${loanId}`;

    // Prepare payload
    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: process.env.MPESA_PASSKEY,
      Timestamp: getCurrentTimestamp(),
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: `${process.env.CALLBACK_URL}/mpesa/c2b/confirmation`,
      AccountReference: billRef,
      TransactionDesc: transactionDesc || "Payment",
    };

    console.log(" STK Payload Sent to Safaricom:", payload);

    // Send to Safaricom
    const { data } = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(" STK Push initiated successfully:", data);
    res.status(200).json({ success: true, message: "STK Push sent", data });
  } catch (error) {
    console.error(" STK Push Error (Full):", error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
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
