const Wallet = require("../models/Wallet");
const Deposit = require("../models/Deposit");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const UserWallet = require("../models/UserWallet");
const WalletLedger = require("../models/WalletLedger");
// =========================
// GET WALLET
// =========================
exports.getWallet = async (req, res) => {
  try {
    let wallet = await UserWallet.findOne({ userId: req.user._id });

    if (!wallet) {
      wallet = await UserWallet.create({
        userId: req.user._id,
      });
    }

    const ledger = await WalletLedger.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      success: true,
      wallet,
      ledger,
    });
  } catch (err) {
    console.error("Get wallet error:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// DEPOSIT REQUEST
// =========================
exports.depositFunds = async (req, res) => {
  try {
    const { amount, txHash, network } = req.body;

    const depositAmount = Number(amount);

    if (!depositAmount || depositAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit amount",
      });
    }

    if (!txHash || txHash.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Valid transaction hash required",
      });
    }

    // Prevent duplicate tx hash
    const existingDeposit = await Deposit.findOne({ txHash });

    if (existingDeposit) {
      return res.status(400).json({
        success: false,
        message: "Transaction hash already used",
      });
    }

    const deposit = await Deposit.create({
      userId: req.user._id,
      amount: depositAmount,
      txHash,
      network: network || "BSC",
      status: "pending",
    });

    await Transaction.create({
      userId: req.user._id,
      type: "deposit",
      amount: depositAmount,
      status: "pending",
      txHash,
      note: "Deposit request submitted",
    });

    res.status(201).json({
      success: true,
      message: "Deposit request submitted",
      deposit,
    });
  } catch (err) {
    console.error("Deposit error:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// WITHDRAW REQUEST
// =========================
exports.withdrawFunds = async (req, res) => {
  try {
    const { amount, walletAddress, network } = req.body;

    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal amount",
      });
    }

    if (!walletAddress || walletAddress.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Valid wallet address required",
      });
    }

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
      network: network || "BSC",
      status: "pending",
    });

    await Transaction.create({
      userId: req.user._id,
      type: "withdrawal",
      amount: withdrawAmount,
      status: "pending",
      note: "Withdrawal request submitted",
      txHash: walletAddress,
      withdrawalId: withdrawal._id,
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted",
      withdrawal,
      balance: user.balance,
    });
  } catch (err) {
    console.error("Withdraw error:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};