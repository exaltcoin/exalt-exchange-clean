const CopyTrade = require("../models/CopyTrade");

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
      symbol: symbol || "BTC/USDT",
      status: "active",
    });

    res.json({
      success: true,
      message: "Copy trading started successfully",
      copy,
    });
  } catch (error) {
    console.error("Start Copy Trade Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start copy trading",
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
      .sort({ createdAt: -1 });

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

    copy.status = "stopped";
    copy.stoppedAt = new Date();

    await copy.save();

    res.json({
      success: true,
      message: "Copy trading stopped successfully",
      copy,
    });
  } catch (error) {
    console.error("Stop Copy Trade Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to stop copy trading",
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