const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load transactions",
    });
  }
});

module.exports = router;