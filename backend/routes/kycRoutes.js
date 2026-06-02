const express = require("express");
const router = express.Router();

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

    return res.status(201).json({
      success: true,
      message: "KYC submitted successfully",
      request: {
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
      },
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
    res.json({
      success: true,
      kycList: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
module.exports = router;