// routes/b2c.js
import express from "express";
import axios from "axios";
import { getMpesaToken } from "./mpesa.js";

const b2c = express.Router();
b2c.post("/send", async (req, res) => {
  try {
    const token = await getMpesaToken();
    const url = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";

    const { data } = await axios.post(
      url,
      {
        InitiatorName: process.env.MPESA_INITIATOR,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: "BusinessPayment", 
        Amount: req.body.amount,
        PartyA: process.env.MPESA_SHORTCODE,
        PartyB: req.body.msisdn, 
        Remarks: "Loan Disbursement",
        QueueTimeOutURL: process.env.CALLBACK_URL + "/b2c/timeout",
        ResultURL: process.env.CALLBACK_URL + "/b2c/result",
        Occasion: "Loan",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





b2c.post("/result", (req, res) => {
  console.log("B2C Result Raw:", JSON.stringify(req.body, null, 2));

  const result = req.body.Result;

  if (result?.ResultCode === 0) {
    const params = result.ResultParameters.ResultParameter;

    // Convert array of { Key, Value } into an object
    const details = params.reduce((acc, p) => {
      acc[p.Key] = p.Value;
      return acc;
    }, {});

    console.log("Extracted Transaction Details:", details);

    // Example usage
    const transactionId = details.TransactionReceipt;
    const amount = details.TransactionAmount;
    const receiver = details.ReceiverPartyPublicName;

    // 🔹 Save to DB (mpesa_b2c_transactions)
    // 🔹 Update loan status
  } else {
    console.error("B2C Failed:", result?.ResultDesc);
  }

  res.json({ ResultCode: 0, ResultDesc: "Result Received" });
});


// Handle Timeout
b2c.post("/timeout", (req, res) => {
  console.log("B2C Timeout:", req.body);
  res.json({ ResultCode: 0, ResultDesc: "Timeout Received" });
});

export default b2c;
