const mongoose = require("mongoose");

const signalSchema = new mongoose.Schema(
  {
    pair: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "BTC/USDT",
    },

    signal: {
      type: String,
      enum: ["BUY", "SELL", "HOLD"],
      default: "HOLD",
      index: true,
    },

    confidence: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },

    entry: {
      type: Number,
      default: 0,
    },

    takeProfit: {
      type: Number,
      default: 0,
    },

    stopLoss: {
      type: Number,
      default: 0,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1500,
    },

    result: {
      type: String,
      default: "",
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const aiTradingAssistantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    riskMode: {
      type: String,
      enum: ["Conservative", "Balanced", "Aggressive"],
      default: "Balanced",
      index: true,
    },

    totalSignals: {
      type: Number,
      default: 0,
      min: 0,
    },

    successfulSignals: {
      type: Number,
      default: 0,
      min: 0,
    },

    accuracy: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },

    signals: {
      type: [signalSchema],
      default: [],
    },

    history: {
      type: [historySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

aiTradingAssistantSchema.index({ userId: 1 });
aiTradingAssistantSchema.index({ accuracy: -1 });
aiTradingAssistantSchema.index({ updatedAt: -1 });

module.exports =
  mongoose.models.AITradingAssistant ||
  mongoose.model("AITradingAssistant", aiTradingAssistantSchema);