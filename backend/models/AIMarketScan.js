const mongoose = require("mongoose");

const scanIndicatorSchema = new mongoose.Schema(
  {
    rsi: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    macd: {
      type: String,
      enum: ["Bullish", "Bearish", "Neutral"],
      default: "Neutral",
    },

    emaTrend: {
      type: String,
      enum: ["Bullish", "Bearish", "Neutral"],
      default: "Neutral",
    },

    volumeSignal: {
      type: String,
      enum: ["High", "Normal", "Low"],
      default: "Normal",
    },

    volatility: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
  },
  {
    _id: false,
  }
);

const aiMarketScanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    symbol: {
      type: String,
      default: "BTCUSDT",
      uppercase: true,
      trim: true,
      index: true,
    },

    timeframe: {
      type: String,
      enum: ["1m", "5m", "15m", "1h", "4h", "1d"],
      default: "1h",
      index: true,
    },

    marketType: {
      type: String,
      enum: ["Spot", "Futures"],
      default: "Spot",
      index: true,
    },

    currentPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    buyZone: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellZone: {
      type: Number,
      default: 0,
      min: 0,
    },

    stopLoss: {
      type: Number,
      default: 0,
      min: 0,
    },

    takeProfit: {
      type: Number,
      default: 0,
      min: 0,
    },

    trend: {
      type: String,
      enum: ["Bullish", "Bearish", "Neutral"],
      default: "Neutral",
      index: true,
    },

    signal: {
      type: String,
      enum: ["Buy", "Sell", "Hold"],
      default: "Hold",
      index: true,
    },

    trendStrength: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    aiConfidence: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
      index: true,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true,
    },

    indicators: {
      type: scanIndicatorSchema,
      default: () => ({}),
    },

    recommendation: {
      type: String,
      default: "Wait for stronger confirmation before entering the market.",
      trim: true,
      maxlength: 1500,
    },

    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },

    adminReviewed: {
      type: Boolean,
      default: false,
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["Scanned", "Saved", "Reviewed", "Flagged"],
      default: "Scanned",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

aiMarketScanSchema.index({
  user: 1,
  createdAt: -1,
});

aiMarketScanSchema.index({
  symbol: 1,
  timeframe: 1,
});

aiMarketScanSchema.index({
  signal: 1,
  riskLevel: 1,
});

module.exports =
  mongoose.models.AIMarketScan ||
  mongoose.model("AIMarketScan", aiMarketScanSchema);