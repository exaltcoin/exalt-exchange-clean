const AIRecord = require("../models/AIRecord");

// GET /api/ai/:module
const getAIRecords = async (req, res) => {
  try {
    const { module } = req.params;

    const records = await AIRecord.find({ module })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      module,
      count: records.length,
      records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch AI records",
      error: error.message,
    });
  }
};

// POST /api/ai
const createAIRecord = async (req, res) => {
  try {
    const record = await AIRecord.create(req.body);

    res.status(201).json({
      success: true,
      message: "AI record created successfully",
      record,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create AI record",
      error: error.message,
    });
  }
};

// GET /api/ai/summary/all
const getAISummary = async (req, res) => {
  try {
    const summary = await AIRecord.aggregate([
      {
        $group: {
          _id: "$module",
          total: { $sum: 1 },
          avgConfidence: { $avg: "$confidence" },
          active: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch AI summary",
      error: error.message,
    });
  }
};
const { buildTradingSignal } = require("../services/aiEngine");

const getTradingAssistant = async (req, res) => {
  try {
  const response = await fetch(
  "https://api.exchange.coinbase.com/products/BTC-USD/stats"
);

const market = await response.json();

const last = Number(market.last);
const open = Number(market.open);
const change = open > 0 ? ((last - open) / open) * 100 : 0;

const btc = {
  price: last,
  changePercent: change,
  volume: Number(market.volume),
};
    const signal = buildTradingSignal({
      symbol: "BTCUSDT",
      price: btc.price,
      changePercent: btc.changePercent,
      volume: btc.volume,
    });
console.log(btc);
    res.json({
      success: true,
      records: [signal],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
module.exports = {
  getAIRecords,
  createAIRecord,
  getAISummary,
  getTradingAssistant,
};