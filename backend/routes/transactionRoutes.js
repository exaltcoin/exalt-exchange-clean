const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const { protect, adminOnly } = require("../middleware/authMiddleware");
router.get("/", protect, async (req, res) => {
  try {
   const transactions = await Transaction.find({
  userId: req.user._id,
})
  .sort({ createdAt: -1 })
  .limit(100);
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
router.get("/admin", protect, adminOnly, async (req, res) => {
  try {
    const transactions = await Transaction.find()
.populate("userId", "name email")
.sort({ createdAt: -1 })
.limit(100);
    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
module.exports = router;