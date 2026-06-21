const mongoose = require("mongoose");

const copyTradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    traderId: {
      type: String,
      required: true,
      trim: true,
    },

    traderName: {
      type: String,
      required: true,
      trim: true,
    },

    traderAvatar: {
      type: String,
      default: "",
    },

    roi: {
      type: Number,
      default: 0,
    },

    winRate: {
      type: Number,
      default: 0,
    },

    risk: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    followers: {
      type: String,
      default: "0",
    },

    copyAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    symbol: {
      type: String,
      default: "BTC/USDT",
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "stopped"],
      default: "active",
      index: true,
    },

    copiedTrades: {
      type: Number,
      default: 0,
    },

    profitLoss: {
      type: Number,
      default: 0,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    stoppedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

copyTradeSchema.index({ userId: 1, traderId: 1, status: 1 });

module.exports = mongoose.model("CopyTrade", copyTradeSchema);