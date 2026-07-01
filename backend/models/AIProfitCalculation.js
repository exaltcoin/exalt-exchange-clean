const mongoose = require("mongoose");

const profitHistorySchema = new mongoose.Schema(
  {
    symbol: { type: String, default: "BTC/USDT" },
    marketType: {
      type: String,
      enum: ["Spot", "Futures", "Staking", "Copy Trading", "Grid Trading"],
      default: "Spot",
    },
    capital: { type: Number, required: true, min: 0 },
    entryPrice: { type: Number, default: 0 },
    exitPrice: { type: Number, default: 0 },
    leverage: { type: Number, default: 1, min: 1, max: 125 },
    positionType: {
      type: String,
      enum: ["Long", "Short", "Spot Buy", "Neutral"],
      default: "Long",
    },
    expectedProfit: { type: Number, default: 0 },
    expectedLoss: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
    riskRewardRatio: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    dailyProfit: { type: Number, default: 0 },
    weeklyProfit: { type: Number, default: 0 },
    monthlyProfit: { type: Number, default: 0 },
    yearlyProfit: { type: Number, default: 0 },
    aiConfidence: { type: Number, default: 80, min: 0, max: 100 },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    recommendation: {
      type: String,
      default: "Use proper risk management before entering any trade.",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiProfitCalculationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    symbol: {
      type: String,
      default: "BTC/USDT",
      uppercase: true,
      trim: true,
    },

    marketType: {
      type: String,
      enum: ["Spot", "Futures", "Staking", "Copy Trading", "Grid Trading"],
      default: "Spot",
    },

    capital: {
      type: Number,
      required: true,
      min: 0,
    },

    entryPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    exitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    stopLossPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    takeProfitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    leverage: {
      type: Number,
      default: 1,
      min: 1,
      max: 125,
    },

    positionType: {
      type: String,
      enum: ["Long", "Short", "Spot Buy", "Neutral"],
      default: "Long",
    },

    expectedProfit: {
      type: Number,
      default: 0,
    },

    expectedLoss: {
      type: Number,
      default: 0,
    },

    netProfit: {
      type: Number,
      default: 0,
    },

    roi: {
      type: Number,
      default: 0,
    },

    riskRewardRatio: {
      type: Number,
      default: 0,
    },

    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    dailyProfit: {
      type: Number,
      default: 0,
    },

    weeklyProfit: {
      type: Number,
      default: 0,
    },

    monthlyProfit: {
      type: Number,
      default: 0,
    },

    yearlyProfit: {
      type: Number,
      default: 0,
    },

    compoundEnabled: {
      type: Boolean,
      default: false,
    },

    compoundDays: {
      type: Number,
      default: 30,
      min: 1,
    },

    compoundResult: {
      type: Number,
      default: 0,
    },

    aiConfidence: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    recommendation: {
      type: String,
      default: "Use proper risk management before entering any trade.",
    },

    status: {
      type: String,
      enum: ["Calculated", "Saved", "Reviewed", "Flagged"],
      default: "Calculated",
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    adminReviewed: {
      type: Boolean,
      default: false,
    },

    adminNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    history: {
      type: [profitHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "AIProfitCalculation",
  aiProfitCalculationSchema
);