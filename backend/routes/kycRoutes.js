const express = require("express");
const router = express.Router();
const Kyc = require("../models/Kyc");
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      country,
      walletAddress,
      idType,
      idNumber,
      telegramUsername,
      projectName,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !country ||
      !walletAddress
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields missing",
      });
    }
    console.log("KYC BODY:", req.body);
    console.log("USER ID:", userId);
const newKyc = new Kyc({
  userId,
  fullName,
  email,
  country,
  walletAddress,
  idType,
  idNumber,
  telegramUsername,
  projectName,
  status: "pending",
});
await newKyc.save();
console.log("KYC SAVED:", newKyc);
const allKycs = await Kyc.find();
console.log("ALL KYCS:", allKycs);
    return res.status(201).json({
      success: true,
      message: "KYC submitted successfully",
      request: newKyc,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/", async (req, res) => {
  try {
    const kycList = await Kyc.find();
    res.json({
      success: true,
      kycList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
module.exports = router;