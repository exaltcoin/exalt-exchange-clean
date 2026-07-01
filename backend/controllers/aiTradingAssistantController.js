const AITradingAssistant = require("../models/AITradingAssistant");

const defaultSignals = [
  {
    pair: "BTC/USDT",
    signal: "BUY",
    confidence: 78,
    entry: 65000,
    takeProfit: 67500,
    stopLoss: 63500,
    riskLevel: "Medium",
    reason: "BTC momentum is improving with strong market volume.",
  },
  {
    pair: "ETH/USDT",
    signal: "HOLD",
    confidence: 71,
    entry: 3500,
    takeProfit: 3650,
    stopLoss: 3400,
    riskLevel: "Low",
    reason: "ETH is consolidating near support with stable volume.",
  },
  {
    pair: "BNB/USDT",
    signal: "BUY",
    confidence: 74,
    entry: 590,
    takeProfit: 620,
    stopLoss: 575,
    riskLevel: "Medium",
    reason: "BNB shows bullish continuation after breakout.",
  },
];

const getOrCreateAssistant = async (userId) => {
  let assistant = await AITradingAssistant.findOne({ userId });

  if (!assistant) {
    assistant = await AITradingAssistant.create({
      userId,
      riskMode: "Balanced",
      totalSignals: defaultSignals.length,
      successfulSignals: 0,
      accuracy: 72,
      signals: defaultSignals,
      history: [
        {
          action: "Assistant Created",
          note: "AI Trading Assistant initialized",
          result: "success",
        },
      ],
    });
  }

  return assistant;
};

exports.getAssistantOverview = async (req, res) => {
  try {
    const assistant = await getOrCreateAssistant(req.user._id);

    res.json({
      success: true,
      assistant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load AI Trading Assistant",
      error: error.message,
    });
  }
};

exports.getTradingSignals = async (req, res) => {
  try {
    const assistant = await getOrCreateAssistant(req.user._id);

    res.json({
      success: true,
      signals: assistant.signals || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load trading signals",
      error: error.message,
    });
  }
};

exports.analyzeTrade = async (req, res) => {
  try {
    const { pair, side, entry, stopLoss, takeProfit, amount, leverage } = req.body;

    if (!pair || !side || !entry) {
      return res.status(400).json({
        success: false,
        message: "Pair, side and entry are required",
      });
    }

    const assistant = await getOrCreateAssistant(req.user._id);

    const entryPrice = Number(entry);
    const sl = Number(stopLoss || 0);
    const tp = Number(takeProfit || 0);
    const tradeAmount = Number(amount || 0);
    const lev = Number(leverage || 1);

    let riskReward = 0;
    if (sl > 0 && tp > 0) {
      const risk = Math.abs(entryPrice - sl);
      const reward = Math.abs(tp - entryPrice);
      riskReward = risk > 0 ? Number((reward / risk).toFixed(2)) : 0;
    }

    let score = 60;
    if (riskReward >= 2) score += 15;
    if (riskReward >= 3) score += 10;
    if (lev > 10) score -= 15;
    if (lev > 25) score -= 20;
    if (tradeAmount > 1000) score -= 5;

    score = Math.max(5, Math.min(95, score));

    const riskLevel = score >= 75 ? "Low" : score >= 50 ? "Medium" : "High";

    const analysis = {
      pair: String(pair).toUpperCase(),
      side,
      entry: entryPrice,
      stopLoss: sl,
      takeProfit: tp,
      amount: tradeAmount,
      leverage: lev,
      confidence: score,
      riskReward,
      riskLevel,
      recommendation:
        score >= 75
          ? "Trade setup looks strong with controlled risk."
          : score >= 50
          ? "Trade setup is acceptable, but manage risk carefully."
          : "Trade setup is risky. Consider reducing leverage or improving stop loss.",
      createdAt: new Date(),
    };

    assistant.history.unshift({
      action: "Trade Analyzed",
      note: `${analysis.side} ${analysis.pair} analyzed`,
      result: riskLevel,
      metadata: analysis,
      createdAt: new Date(),
    });

    assistant.history = assistant.history.slice(0, 100);
    await assistant.save();

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Trade analysis failed",
      error: error.message,
    });
  }
};

exports.getAssistantHistory = async (req, res) => {
  try {
    const assistant = await getOrCreateAssistant(req.user._id);

    res.json({
      success: true,
      history: assistant.history || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load assistant history",
      error: error.message,
    });
  }
};

exports.saveAssistantNote = async (req, res) => {
  try {
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: "Note is required",
      });
    }

    const assistant = await getOrCreateAssistant(req.user._id);

    assistant.history.unshift({
      action: "User Note",
      note,
      result: "saved",
      createdAt: new Date(),
    });

    assistant.history = assistant.history.slice(0, 100);
    await assistant.save();

    res.status(201).json({
      success: true,
      message: "Assistant note saved",
      history: assistant.history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save assistant note",
      error: error.message,
    });
  }
};