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

    if (!fullName || !email || !country || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: "All required fields missing",
      });
    }

    const newKyc = await Kyc.create({
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
    const kycList = await Kyc.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      kycList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;