const mongoose = require("mongoose");

const copyTradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    traderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
      min: 0,
      max: 100,
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

    coin: {
      type: String,
      default: "USDT",
      uppercase: true,
      trim: true,
    },

    copyAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    /* Real locked balance */
    lockedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    symbol: {
      type: String,
      default: "BTC/USDT",
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "active",
        "paused",
        "stopped",
        "completed",
      ],
      default: "active",
      index: true,
    },

    copiedTrades: {
      type: Number,
      default: 0,
    },

    winningTrades: {
      type: Number,
      default: 0,
    },

    losingTrades: {
      type: Number,
      default: 0,
    },

    profitLoss: {
      type: Number,
      default: 0,
    },

    totalFees: {
      type: Number,
      default: 0,
    },

    lastTradeAt: {
      type: Date,
      default: null,
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
  {
    timestamps: true,
  }
);

/* Indexes */
copyTradeSchema.index({
  userId: 1,
  traderId: 1,
  status: 1,
});

copyTradeSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports =
  mongoose.models.CopyTrade ||
  mongoose.model("CopyTrade", copyTradeSchema);