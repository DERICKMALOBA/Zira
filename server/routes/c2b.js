// routes/c2b.js
import express from "express";
import axios from "axios";
import { getMpesaToken } from "./mpesa.js";

const c2b = express.Router();

// Register your callback URLs once
c2b.get("/register", async (req, res) => {
  try {
    const token = await getMpesaToken();
    const url = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl";

    const { data } = await axios.post(
      url,
      {
        ShortCode: process.env.MPESA_SHORTCODE,
        ResponseType: "Completed",
        ConfirmationURL: process.env.CALLBACK_URL + "/c2b/confirmation",
        ValidationURL: process.env.CALLBACK_URL + "/c2b/validation",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validation URL (optional)
c2b.post("/validation", (req, res) => {
  console.log("C2B Validation:", req.body);
  // You can reject invalid payments here
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

// Confirmation URL
c2b.post("/confirmation", (req, res) => {
  console.log("C2B Confirmation:", req.body);

  const payment = {
    transaction_id: req.body.TransID,
    amount: req.body.TransAmount,
    msisdn: req.body.MSISDN,
    account_reference: req.body.BillRefNumber,
    trans_time: req.body.TransTime,
  };

  // 🔹 Save to `mpesa_c2b_transactions`
  // 🔹 Match account_reference → loan_id
  // 🔹 Update loan_installments.paid_amount

  res.json({ ResultCode: 0, ResultDesc: "Confirmation Received" });
});

export default c2b;
