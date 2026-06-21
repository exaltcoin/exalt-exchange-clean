const express = require("express");
const LearnEarn = require("../models/LearnEarn");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const records = await LearnEarn.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error("Admin Learn Earn Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load Learn & Earn admin data",
    });
  }
});

module.exports = router;