const mongoose = require("mongoose");

const whaleWalletSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      trim: true,
    },

    network: {
      type: String,
      enum: ["BNB Chain", "Ethereum", "Solana", "Bitcoin", "Polygon"],
      default: "Ethereum",
    },

    transactionHash: {
      type: String,
      default: "",
      trim: true,
    },

    transactionType: {
      type: String,
      enum: ["Buy", "Sell", "Transfer", "Unknown"],
      default: "Unknown",
    },

    amountCoin: {
      type: Number,
      default: 0,
      min: 0,
    },

    amountUSD: {
      type: Number,
      default: 0,
      min: 0,
    },

    walletScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const aiWhaleHeatmapSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "BTCUSDT",
    },

    baseCoin: {
      type: String,
      uppercase: true,
      trim: true,
      default: "BTC",
    },

    network: {
      type: String,
      enum: ["BNB Chain", "Ethereum", "Solana", "Bitcoin", "Polygon"],
      default: "Ethereum",
    },

    currentPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWhaleVolumeUSD: {
      type: Number,
      default: 0,
      min: 0,
    },

    buyVolumeUSD: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellVolumeUSD: {
      type: Number,
      default: 0,
      min: 0,
    },

    transferVolumeUSD: {
      type: Number,
      default: 0,
      min: 0,
    },

    buyPressure: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    sellPressure: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    whaleScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    heatLevel: {
      type: String,
      enum: ["Cold", "Warm", "Hot", "Extreme"],
      default: "Warm",
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    aiConfidence: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },

    signal: {
      type: String,
      enum: ["Bullish", "Bearish", "Neutral"],
      default: "Neutral",
    },

    recommendation: {
      type: String,
      default:
        "AI whale heatmap generated from live market and whale activity. Confirm liquidity and market risk before trading.",
    },

    wallets: {
      type: [whaleWalletSchema],
      default: [],
    },

    source: {
      type: String,
      enum: ["Binance", "Moralis", "BscScan", "Etherscan", "Hybrid"],
      default: "Hybrid",
    },

    status: {
      type: String,
      enum: ["Active", "Reviewed", "Archived"],
      default: "Active",
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

    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIWhaleHeatmap", aiWhaleHeatmapSchema);