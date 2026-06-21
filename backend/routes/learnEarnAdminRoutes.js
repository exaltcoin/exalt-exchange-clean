import express from "express";
import LearnEarn from "../models/LearnEarn.js";
import User from "../models/User.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

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

export default router;