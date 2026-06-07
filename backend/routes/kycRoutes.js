const express = require("express");
const router = express.Router();
const Kyc = require("../models/Kyc");
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
router.post(
  "/submit",
  upload.fields([
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
    { name: "passportImage", maxCount: 1 },
    { name: "selfieImage", maxCount: 1 },
  ]),
  async (req, res) => {
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
const cnicFront =
  req.files?.cnicFront?.[0]
    ? `data:${req.files.cnicFront[0].mimetype};base64,${req.files.cnicFront[0].buffer.toString("base64")}`
    : "";

const cnicBack =
  req.files?.cnicBack?.[0]
    ? `data:${req.files.cnicBack[0].mimetype};base64,${req.files.cnicBack[0].buffer.toString("base64")}`
    : "";

const passportImage =
  req.files?.passportImage?.[0]
    ? `data:${req.files.passportImage[0].mimetype};base64,${req.files.passportImage[0].buffer.toString("base64")}`
    : "";

const selfieImage =
  req.files?.selfieImage?.[0]
    ? `data:${req.files.selfieImage[0].mimetype};base64,${req.files.selfieImage[0].buffer.toString("base64")}`
    : "";
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
    if (
  !cnicFront &&
  !cnicBack &&
  !passportImage
) {
  return res.status(400).json({
    success: false,
    message: "Please upload required identity documents",
  });
}
    console.log("KYC BODY:", req.body);
    console.log("USER ID:", userId);
const cleanEmail = email.toLowerCase().trim();
const existingKyc = await Kyc.findOne({
  $or: [
    { email: cleanEmail },
    { userId: userId }
  ]
});
if (existingKyc) {
  return res.status(400).json({
    success: false,
   message:
  existingKyc.status === "approved"
    ? "Your KYC is already approved."
    : "Your KYC is already submitted and waiting for admin review.",
  });
}
    const newKyc = new Kyc({
  userId,
  fullName,
  email: cleanEmail,
  phone,
  country,
  idType,
  idNumber,
  cnicFront,
cnicBack,
passportImage,
selfieImage,
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