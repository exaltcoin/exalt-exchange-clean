const express = require("express");
const router = express.Router();

const Deposit = require("../models/Deposit");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const UserWallet = require("../models/UserWallet");
const WalletLedger = require("../models/WalletLedger");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ADMIN ONLY: get all deposit requests
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const requests = await Deposit.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// USER: create deposit request
router.post("/", protect, async (req, res) => {
  try {
    const { amount, coin, network, transactionId, txHash, proofUrl } = req.body;
    const reference = txHash || transactionId || proofUrl;

if (!reference || reference.trim().length < 3) {
  return res.status(400).json({
    success: false,
    message: "Transaction hash / reference ID is required",
  });
}

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid deposit amount is required",
      });
    }

    const deposit = await Deposit.create({
      userId: req.user._id,
      email: req.user.email,
      amount: Number(amount),
      coin: coin || "USDT",
      network: network || "BSC",
     transactionId: reference,
txHash: reference,
proofUrl: reference,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully",
      request: deposit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ADMIN ONLY: approve/reject deposit
router.post("/status", protect, adminOnly, async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "Deposit id and status are required",
      });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit status",
      });
    }

    const request = await Deposit.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found",
      });
    }

    if (request.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Deposit already approved",
      });
    }

    if (request.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Deposit already rejected",
      });
    }

    request.status = status;

   if (status === "approved" && request.credited === true) {
  return res.status(400).json({
    success: false,
    message: "Deposit already credited",
  });
}

if (status === "rejected") {
  request.rejectedBy = req.user._id;
  request.rejectedAt = new Date();
}

    if (status === "approved") {
      const amount = Number(request.amount);

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid deposit amount",
        });
      }

      const coin = (request.coin || "USDT").toUpperCase();

const wallet = await UserWallet.findOneAndUpdate(
  { userId: request.userId },
  {
    $setOnInsert: {
      userId: request.userId,
    },
  },
  {
    new: true,
    upsert: true,
  }
);

if (wallet.isFrozen) {
  return res.status(403).json({
    success: false,
    message: wallet.freezeReason || "User wallet is frozen",
  });
}

const balanceBefore = Number(wallet.balances?.[coin] || 0);
const balanceAfter = balanceBefore + amount;

wallet.balances[coin] = balanceAfter;
wallet.totalDeposited[coin] = Number(wallet.totalDeposited?.[coin] || 0) + amount;

await wallet.save();

const ledger = await WalletLedger.create({
  userId: request.userId,
  type: "DEPOSIT_CREDIT",
  coin,
  amount,
  balanceBefore,
  balanceAfter,
  referenceId: request._id,
  referenceModel: "Deposit",
  status: "SUCCESS",
  note: "Manual deposit approved by admin",
  createdBy: req.user._id,
});

request.credited = true;
request.creditedAt = new Date();
request.creditedBy = req.user._id;
request.walletLedgerId = ledger._id;
request.approvedBy = req.user._id;
request.approvedAt = new Date();
 }
 await request.save();

res.json({
  success: true,
  message: `Deposit ${status} successfully`,
  request,
});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;