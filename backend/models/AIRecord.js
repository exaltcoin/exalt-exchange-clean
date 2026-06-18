const mongoose = require("mongoose");

const aiRecordSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      enum: [
        "staking",
        "learn_earn",
        "ai_trading_assistant",
        "ai_copy_trading",
        "ai_portfolio_manager",
        "social_trading",
        "ai_risk_manager",
        "ai_profit_calculator",
        "ai_market_scanner",
        "ai_news",
        "ai_whale_tracker",
        "ai_arbitrage_scanner",
        "ai_grid_trading",
        "ai_smart_alerts",
        "ai_launchpad",
        "ai_whale_heatmap",
      ],
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    symbol: {
      type: String,
      default: "EXALT",
      uppercase: true,
      trim: true,
    },

    signal: {
      type: String,
      default: "neutral",
      enum: ["buy", "sell", "neutral", "bullish", "bearish", "warning"],
      index: true,
    },

    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    value: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      default: "active",
      enum: ["active", "pending", "completed", "paused", "closed"],
      index: true,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AIRecord || mongoose.model("AIRecord", aiRecordSchema);