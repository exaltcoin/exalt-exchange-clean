const express = require("express");
const router = express.Router();

const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// USER: submit withdrawal
router.post("/", protect, async (req, res) => {
  try {
    const { amount, walletAddress } = req.body;

    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0 || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Valid amount and wallet address are required",
      });
    }

    // Secure balance deduct only from logged-in user
    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        balance: { $gte: withdrawAmount },
      },
      {
        $inc: { balance: -withdrawAmount },
      },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const withdrawal = await Withdrawal.create({
      userId: req.user._id,
      amount: withdrawAmount,
      walletAddress,
      status: "pending",
    });

    await Transaction.create({
      userId: req.user._id,
      type: "withdrawal",
      amount: withdrawAmount,
      status: "pending",
      note: "Withdrawal request submitted",
      toHash: walletAddress,
      withdrawalId: withdrawal._id,
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted",
      withdrawal,
      balance: user.balance,
    });
  } catch (error) {
    console.error("Withdrawal submit error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ADMIN: get all withdrawals
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email balance role");

    res.json({
      success: true,
      withdrawals,
    });
  } catch (error) {
    console.error("Get withdrawals error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// USER: get own withdrawals
router.get("/my", protect, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      withdrawals,
    });
  } catch (error) {
    console.error("My withdrawals error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ADMIN: approve/reject withdrawal
router.post("/status", protect, adminOnly, async (req, res) => {
  try {
    const { id, status } = req.body;

    const allowedStatuses = ["approved", "rejected"];

    if (!id || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid withdrawal id and status are required",
      });
    }

    // Atomic update: only pending withdrawal can be processed
    const withdrawal = await Withdrawal.findOneAndUpdate(
      {
        _id: id,
        status: "pending",
      },
      {
        status,
        processedBy: req.user._id,
        processedAt: new Date(),
      },
      { new: true }
    );

    if (!withdrawal) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal not found or already processed",
      });
    }

    // If rejected, refund balance only once
    if (status === "rejected") {
      await User.findByIdAndUpdate(withdrawal.userId, {
        $inc: { balance: Number(withdrawal.amount) },
      });
    }

    await Transaction.findOneAndUpdate(
      {
        withdrawalId: withdrawal._id,
        type: "withdrawal",
      },
      {
        status,
        note:
          status === "approved"
            ? "Withdrawal approved by admin"
            : "Withdrawal rejected and refunded",
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Withdrawal ${status} successfully`,
      withdrawal,
    });
  } catch (error) {
    console.error("Withdrawal status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;