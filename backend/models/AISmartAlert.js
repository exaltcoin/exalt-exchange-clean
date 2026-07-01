const mongoose = require("mongoose");

const aiSmartAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    symbol: {
      type: String,
      uppercase: true,
      trim: true,
      default: "BTCUSDT",
      index: true,
    },

    alertType: {
      type: String,
      enum: ["Price", "Volume", "Whale", "Risk", "News", "Arbitrage", "Grid"],
      default: "Price",
      index: true,
    },

    condition: {
      type: String,
      enum: ["Above", "Below", "Spike", "Drop", "Detected"],
      default: "Above",
    },

    targetPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      index: true,
    },

    aiConfidence: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1500,
    },

    recommendation: {
      type: String,
      default:
        "AI smart alert created. Monitor market conditions before taking action.",
      trim: true,
      maxlength: 1500,
    },

    isTriggered: {
      type: Boolean,
      default: false,
      index: true,
    },

    triggeredAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },

    telegramSent: {
      type: Boolean,
      default: false,
    },

    emailSent: {
      type: Boolean,
      default: false,
    },

    pushSent: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Active", "Triggered", "Paused", "Archived", "Reviewed"],
      default: "Active",
      index: true,
    },

    adminReviewed: {
      type: Boolean,
      default: false,
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

aiSmartAlertSchema.index({
  user: 1,
  status: 1,
  createdAt: -1,
});

aiSmartAlertSchema.index({
  symbol: 1,
  isTriggered: 1,
});

module.exports =
  mongoose.models.AISmartAlert ||
  mongoose.model("AISmartAlert", aiSmartAlertSchema);