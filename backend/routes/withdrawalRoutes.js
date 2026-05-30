const express = require("express");
const router = express.Router();

const Withdrawal = require("../models/Withdrawal");
const User = require("../models/user");
const Transaction = require("../models/Transaction");

// submit withdrawal
router.post("/", async (req, res) => {
  try {
    const { userId, amount, walletAddress } = req.body;

    if (!userId || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (Number(user.balance || 0) < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const withdrawal = await Withdrawal.create({
      userId,
      amount: Number(amount),
      walletAddress,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted",
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// get all withdrawals
router.get("/", async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      withdrawals,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// approve / reject withdrawal
router.post("/status", async (req, res) => {
  try {
    const { id, status } = req.body;

    const withdrawal = await Withdrawal.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found",
      });
    }

    if (status === "approved") {
      await User.findByIdAndUpdate(withdrawal.userId, {
        $inc: { balance: -Number(withdrawal.amount) },
      });

      await Transaction.create({
        userId: withdrawal.userId,
        type: "withdrawal",
        amount: Number(withdrawal.amount),
        status: "approved",
        note: "Withdrawal approved by admin",
        txHash: withdrawal.walletAddress,
      });
    }

    res.json({
      success: true,
      message: "Withdrawal updated",
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// approve / reject withdrawal
router.post("/status", async (req, res) => {
  try {
    const { id, status } = req.body;

    const withdrawal = await Withdrawal.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found",
      });
    }

    if (status === "approved") {
      await User.findByIdAndUpdate(withdrawal.userId, {
        $inc: { balance: -Number(withdrawal.amount) },
      });

      await Transaction.create({
        userId: withdrawal.userId,
        type: "withdrawal",
        amount: Number(withdrawal.amount),
        status: "approved",
        note: "Withdrawal approved by admin",
        txHash: withdrawal.walletAddress,
      });
    }

    res.json({
      success: true,
      message: "Withdrawal updated",
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;