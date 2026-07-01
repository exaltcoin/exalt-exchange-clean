const mongoose = require("mongoose");

const whaleTrackerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },

    network: {
      type: String,
      default: "Ethereum",
    },

    walletAddress: {
      type: String,
      required: true,
    },

    transactionType: {
      type: String,
      enum: ["Buy", "Sell"],
      default: "Buy",
    },

    amountUSD: {
      type: Number,
      default: 0,
    },

    amountCoin: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      default: 0,
    },

    aiSignal: {
      type: String,
      enum: ["Bullish", "Bearish", "Neutral"],
      default: "Bullish",
    },

    confidence: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    impactLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    reviewed: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },

    aiRecommendation: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AIWhaleTracker",
  whaleTrackerSchema
);