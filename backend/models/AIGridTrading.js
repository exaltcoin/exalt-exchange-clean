const mongoose = require("mongoose");

const aiGridTradingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "BTCUSDT",
      index: true,
    },

    baseCoin: {
      type: String,
      uppercase: true,
      trim: true,
      default: "BTC",
    },

    marketType: {
      type: String,
      enum: ["Spot", "Futures"],
      default: "Spot",
      index: true,
    },

    strategyName: {
      type: String,
      default: "AI Grid Strategy",
      trim: true,
    },

    lowerPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    upperPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    gridCount: {
      type: Number,
      default: 10,
      min: 2,
      max: 200,
    },

    investment: {
      type: Number,
      default: 1000,
      min: 0,
    },

    leverage: {
      type: Number,
      default: 1,
      min: 1,
      max: 125,
    },

    gridStep: {
      type: Number,
      default: 0,
    },

    estimatedProfitPerGrid: {
      type: Number,
      default: 0,
    },

    estimatedDailyProfit: {
      type: Number,
      default: 0,
    },

    estimatedMonthlyProfit: {
      type: Number,
      default: 0,
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

    status: {
      type: String,
      enum: ["Active", "Paused", "Stopped", "Reviewed"],
      default: "Active",
      index: true,
    },

    recommendation: {
      type: String,
      default:
        "AI grid strategy generated. Confirm market volatility, liquidity and risk before enabling live trading.",
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
  },
  {
    timestamps: true,
  }
);

aiGridTradingSchema.index({
  symbol: 1,
  status: 1,
  createdAt: -1,
});

aiGridTradingSchema.index({
  estimatedMonthlyProfit: -1,
  riskLevel: 1,
});

aiGridTradingSchema.index({
  marketType: 1,
  aiConfidence: -1,
});

module.exports =
  mongoose.models.AIGridTrading ||
  mongoose.model("AIGridTrading", aiGridTradingSchema);