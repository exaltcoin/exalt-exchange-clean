const express = require("express");
const router = express.Router();
const Kyc = require("../models/Kyc");
const User = require("../models/user");
const multer = require("multer");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/submit",
  protect,
  upload.fields([
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
    { name: "passportImage", maxCount: 1 },
    { name: "selfieImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user._id;

      const { fullName, email, phone, country, idType, idNumber } = req.body;

      const cnicFront = req.files?.cnicFront?.[0]
        ? `data:${req.files.cnicFront[0].mimetype};base64,${req.files.cnicFront[0].buffer.toString("base64")}`
        : "";

      const cnicBack = req.files?.cnicBack?.[0]
        ? `data:${req.files.cnicBack[0].mimetype};base64,${req.files.cnicBack[0].buffer.toString("base64")}`
        : "";

      const passportImage = req.files?.passportImage?.[0]
        ? `data:${req.files.passportImage[0].mimetype};base64,${req.files.passportImage[0].buffer.toString("base64")}`
        : "";

      const selfieImage = req.files?.selfieImage?.[0]
        ? `data:${req.files.selfieImage[0].mimetype};base64,${req.files.selfieImage[0].buffer.toString("base64")}`
        : "";

      if (!fullName || !email || !phone || !country || !idType || !idNumber) {
        return res.status(400).json({
          success: false,
          message: "All required fields missing",
        });
      }

      if (!cnicFront && !cnicBack && !passportImage) {
        return res.status(400).json({
          success: false,
          message: "Please upload required identity documents",
        });
      }

      const cleanEmail = email.toLowerCase().trim();

      const existingKyc = await Kyc.findOne({
        $or: [{ email: cleanEmail }, { userId }],
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

      const newKyc = await Kyc.create({
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
  }
);

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const kycList = await Kyc.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

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

router.put("/admin/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC status",
      });
    }

    const kyc = await Kyc.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNote: adminNote || "",
        reviewedBy: req.user._id,
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

    await User.findByIdAndUpdate(kyc.userId, {
      kycStatus: status,
    });

    res.json({
      success: true,
      message: `KYC ${status} successfully`,
      kyc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/user/:email", protect, async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase().trim();

    if (req.user.role !== "admin" && req.user.email !== email) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const kyc = await Kyc.findOne({ email }).sort({ createdAt: -1 });

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

router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const kycList = await Kyc.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

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