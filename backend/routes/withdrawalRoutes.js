const express = require("express");
const router = express.Router();

const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const UserWallet = require("../models/UserWallet");
const WalletLedger = require("../models/WalletLedger");
const { protect, adminOnly } = require("../middleware/authMiddleware");

/* USER: create withdrawal request */
router.post("/", protect, async (req, res) => {
  try {
    const { amount, walletAddress, coin, network, note } = req.body;

    const withdrawAmount = Number(amount);
    const selectedCoin = (coin || "USDT").toUpperCase();

    if (!withdrawAmount || withdrawAmount <= 0 || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Valid amount and withdrawal address are required",
      });
    }

    const allowedCoins = ["USDT", "BNB", "EXALT"];

    if (!allowedCoins.includes(selectedCoin)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported coin",
      });
    }

    const wallet = await UserWallet.findOne({ userId: req.user._id });

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet not found",
      });
    }

    if (wallet.isFrozen) {
      return res.status(403).json({
        success: false,
        message: wallet.freezeReason || "User wallet is frozen",
      });
    }

    const balanceBefore = Number(wallet.balances?.[selectedCoin] || 0);

    if (balanceBefore < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const balanceAfter = balanceBefore - withdrawAmount;

    wallet.balances[selectedCoin] = balanceAfter;
    await wallet.save();

    const withdrawal = await Withdrawal.create({
      userId: req.user._id,
      amount: withdrawAmount,
      coin: selectedCoin,
      walletAddress,
      network: network || "BSC",
      status: "pending",
      note: note || "Withdrawal request submitted",
    });

    const ledger = await WalletLedger.create({
      userId: req.user._id,
      type: "WITHDRAWAL_DEBIT",
      coin: selectedCoin,
      amount: withdrawAmount,
      balanceBefore,
      balanceAfter,
      referenceId: withdrawal._id,
      referenceModel: "Withdrawal",
      status: "SUCCESS",
      note: "Withdrawal request submitted and balance debited",
      createdBy: req.user._id,
    });

    withdrawal.walletLedgerId = ledger._id;
    await withdrawal.save();

    await Transaction.create({
      userId: req.user._id,
      type: "withdrawal",
      amount: withdrawAmount,
      coin: selectedCoin,
      status: "pending",
      note: "Withdrawal request submitted",
      toHash: walletAddress,
      withdrawalId: withdrawal._id,
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted",
      withdrawal,
      balance: wallet.balances,
    });
  } catch (error) {
    console.error("Withdrawal submit error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ADMIN: get all withdrawals */
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email role");

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

/* USER: get own withdrawals */
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

/* ADMIN: approve/reject withdrawal */
router.post("/status", protect, adminOnly, async (req, res) => {
  try {
    const { id, status, txHash, adminRemark } = req.body;

    if (!id || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid withdrawal id and status are required",
      });
    }

    const withdrawal = await Withdrawal.findOne({
      _id: id,
      status: "pending",
    });

    if (!withdrawal) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal not found or already processed",
      });
    }

    const coin = (withdrawal.coin || "USDT").toUpperCase();
    const amount = Number(withdrawal.amount);

    if (status === "approved") {
      withdrawal.status = "approved";
      withdrawal.approvedBy = req.user._id;
      withdrawal.approvedAt = new Date();
      withdrawal.processedBy = req.user._id;
      withdrawal.processedAt = new Date();
      withdrawal.txHash = txHash || "";
      withdrawal.adminRemark = adminRemark || "Withdrawal approved by admin";
    }

    if (status === "rejected") {
      const wallet = await UserWallet.findOne({ userId: withdrawal.userId });

      if (wallet) {
        const balanceBefore = Number(wallet.balances?.[coin] || 0);
        const balanceAfter = balanceBefore + amount;

        wallet.balances[coin] = balanceAfter;
        wallet.totalWithdrawn[coin] = Number(wallet.totalWithdrawn?.[coin] || 0);

        await wallet.save();

        await WalletLedger.create({
          userId: withdrawal.userId,
          type: "WITHDRAWAL_REFUND",
          coin,
          amount,
          balanceBefore,
          balanceAfter,
          referenceId: withdrawal._id,
          referenceModel: "Withdrawal",
          status: "SUCCESS",
          note: "Withdrawal rejected and balance refunded",
          createdBy: req.user._id,
        });
      }

      withdrawal.status = "rejected";
      withdrawal.rejectedBy = req.user._id;
      withdrawal.rejectedAt = new Date();
      withdrawal.processedBy = req.user._id;
      withdrawal.processedAt = new Date();
      withdrawal.adminRemark = adminRemark || "Withdrawal rejected and refunded";
    }

    await withdrawal.save();

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
        toHash: withdrawal.walletAddress,
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
      message: error.message || "Server error",
    });
  }
});

module.exports = router;