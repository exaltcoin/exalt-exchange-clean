const express = require("express");
const router = express.Router();
const Kyc = require("../models/Kyc");
router.post("/submit", async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      phone,
      country,
      idType,
      idNumber,
    } = req.body;

   if (
  !fullName ||
  !email ||
  !phone ||
  !country ||
  !idType ||
  !idNumber
){
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
  phone,
  country,
  idType,
  idNumber,
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
});router.put("/admin/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const kyc = await Kyc.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC not found",
      });
    }

    res.json({
      success: true,
      kyc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/user/:email", async (req, res) => {
  try {
    const kyc = await Kyc.findOne({ email: req.params.email }).sort({ createdAt: -1 });

    if (!kyc) {
      return res.json({
        success: true,
        kyc: null,
        status: "not_submitted",
      });
    }

    res.json({
      success: true,
      kyc,
      status: kyc.status || "pending",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/admin/all", async (req, res) => {
  try {
    const kycList = await Kyc.find().sort({ createdAt: -1 });

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