const mongoose = require("mongoose");

const reputationHistorySchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    action: {
      type: String,
      default: "System Update",
      trim: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: String,
      enum: ["System", "Admin"],
      default: "System",
    },
  },
  { timestamps: true }
);

const reputationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    reputationScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      index: true,
    },

    level: {
      type: String,
      enum: ["New", "Trusted", "Elite", "High Risk"],
      default: "New",
      index: true,
    },

    badges: {
      type: [String],
      default: [],
    },

    p2pRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    tradingSuccessRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedTrades: {
      type: Number,
      default: 0,
      min: 0,
    },

    successfulP2POrders: {
      type: Number,
      default: 0,
      min: 0,
    },

    disputes: {
      type: Number,
      default: 0,
      min: 0,
    },

    fraudFlags: {
      type: [String],
      default: [],
    },

    isVerifiedInvestor: {
      type: Boolean,
      default: false,
    },

    isTrustedTrader: {
      type: Boolean,
      default: false,
    },

    isScamReporter: {
      type: Boolean,
      default: false,
    },

    adminNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    history: {
      type: [reputationHistorySchema],
      default: [],
    },

    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Reputation ||
  mongoose.model("Reputation", reputationSchema);