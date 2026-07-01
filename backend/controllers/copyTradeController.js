const CopyTrade = require("../models/CopyTrade");
const UserWallet = require("../models/UserWallet");
const WalletLedger = require("../models/WalletLedger");

const topTraders = [
  {
    traderId: "alpha-ai-trader",
    traderName: "Alpha AI Trader",
    traderAvatar: "A",
    roi: 128,
    winRate: 86,
    risk: "Low",
    followers: "12.4K",
    suggestedCopy: 50,
    symbol: "BTC/USDT",
  },
  {
    traderId: "smart-whale-bot",
    traderName: "Smart Whale Bot",
    traderAvatar: "S",
    roi: 96,
    winRate: 78,
    risk: "Medium",
    followers: "8.9K",
    suggestedCopy: 75,
    symbol: "ETH/USDT",
  },
  {
    traderId: "exalt-pro-signal",
    traderName: "Exalt Pro Signal",
    traderAvatar: "E",
    roi: 74,
    winRate: 71,
    risk: "Low",
    followers: "5.2K",
    suggestedCopy: 100,
    symbol: "BNB/USDT",
  },
];

const getOrCreateWallet = async (userId) => {
  return UserWallet.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true }
  );
};

const getTopTraders = async (req, res) => {
  try {
    res.json({
      success: true,
      traders: topTraders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load top traders",
    });
  }
};

const startCopyTrade = async (req, res) => {
  try {
    const {
      traderId,
      traderName,
      traderAvatar,
      roi,
      winRate,
      risk,
      followers,
      copyAmount,
      symbol,
    } = req.body;

    if (!traderId || !traderName || !copyAmount) {
      return res.status(400).json({
        success: false,
        message: "Trader and copy amount are required",
      });
    }

    const amount = Number(copyAmount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid copy amount",
      });
    }

    const existing = await CopyTrade.findOne({
      userId: req.user._id,
      traderId,
      status: "active",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You are already copying this trader",
      });
    }

    const wallet = await getOrCreateWallet(req.user._id);

    if (wallet.isFrozen) {
      return res.status(403).json({
        success: false,
        message: wallet.freezeReason || "User wallet is frozen",
      });
    }

    const balanceBefore = Number(wallet.balances?.USDT || 0);

    if (balanceBefore < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient USDT balance for copy trading",
      });
    }

    const balanceAfter = balanceBefore - amount;

    wallet.balances.USDT = balanceAfter;
    wallet.locked.USDT = Number(wallet.locked?.USDT || 0) + amount;

    await wallet.save();

    const copy = await CopyTrade.create({
      userId: req.user._id,
      traderId,
      traderName,
      traderAvatar: traderAvatar || "",
      roi: Number(roi || 0),
      winRate: Number(winRate || 0),
      risk: risk || "Low",
      followers: followers || "0",
      copyAmount: amount,
      lockedAmount: amount,
      coin: "USDT",
      symbol: symbol || "BTC/USDT",
      status: "active",
      startedAt: new Date(),
    });

    await WalletLedger.create({
      userId: req.user._id,
      type: "ADMIN_ADJUSTMENT",
      coin: "USDT",
      amount,
      balanceBefore,
      balanceAfter,
      referenceId: copy._id,
      referenceModel: "Admin",
      status: "SUCCESS",
      note: `USDT locked for AI Copy Trading: ${traderName}`,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Copy trading started and USDT balance locked successfully",
      copy,
      wallet,
    });
  } catch (error) {
    console.error("Start Copy Trade Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to start copy trading",
    });
  }
};

const getMyCopyTrades = async (req, res) => {
  try {
    const copies = await CopyTrade.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    const activeCount = copies.filter((c) => c.status === "active").length;
    const totalCopiedAmount = copies.reduce(
      (sum, c) => sum + Number(c.copyAmount || 0),
      0
    );
    const totalProfitLoss = copies.reduce(
      (sum, c) => sum + Number(c.profitLoss || 0),
      0
    );

    res.json({
      success: true,
      stats: {
        activeCount,
        totalCopiedAmount,
        totalProfitLoss,
      },
      copies,
    });
  } catch (error) {
    console.error("Get My Copy Trades Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load your copy trades",
    });
  }
};

const getAllCopyTrades = async (req, res) => {
  try {
    const copies = await CopyTrade.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(300);

    res.json({
      success: true,
      copies,
    });
  } catch (error) {
    console.error("Get All Copy Trades Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load all copy trades",
    });
  }
};

const stopCopyTrade = async (req, res) => {
  try {
    const copy = await CopyTrade.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: "active",
    });

    if (!copy) {
      return res.status(404).json({
        success: false,
        message: "Active copy trade not found",
      });
    }

    const amount = Number(copy.lockedAmount || copy.copyAmount || 0);

    const wallet = await getOrCreateWallet(req.user._id);

    const lockedBefore = Number(wallet.locked?.USDT || 0);

    if (lockedBefore < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient locked USDT balance",
      });
    }

    wallet.locked.USDT = lockedBefore - amount;

    const balanceBefore = Number(wallet.balances?.USDT || 0);
    const balanceAfter = balanceBefore + amount;

    wallet.balances.USDT = balanceAfter;

    await wallet.save();

    copy.status = "stopped";
    copy.stoppedAt = new Date();
    copy.lockedAmount = 0;

    await copy.save();

    await WalletLedger.create({
      userId: req.user._id,
      type: "ADMIN_ADJUSTMENT",
      coin: "USDT",
      amount,
      balanceBefore,
      balanceAfter,
      referenceId: copy._id,
      referenceModel: "Admin",
      status: "SUCCESS",
      note: `AI Copy Trading stopped and USDT unlocked: ${copy.traderName}`,
      createdBy: req.user._id,
    });

    res.json({
      success: true,
      message: "Copy trading stopped and USDT unlocked successfully",
      copy,
      wallet,
    });
  } catch (error) {
    console.error("Stop Copy Trade Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to stop copy trading",
    });
  }
};

module.exports = {
  getTopTraders,
  startCopyTrade,
  getMyCopyTrades,
  getAllCopyTrades,
  stopCopyTrade,
};