const mongoose = require("mongoose");

const aiNewsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    source: {
      type: String,
      default: "Exalt AI News",
      trim: true,
    },

    sourceUrl: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Bitcoin",
        "Ethereum",
        "Altcoins",
        "DeFi",
        "Regulation",
        "Exchange",
        "Market",
        "Security",
        "EXALT",
      ],
      default: "Market",
    },

    sentiment: {
      type: String,
      enum: ["Bullish", "Bearish", "Neutral"],
      default: "Neutral",
    },

    marketImpact: {
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

    affectedCoins: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    status: {
      type: String,
      enum: ["Draft", "Published", "Reviewed", "Flagged"],
      default: "Published",
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

    isPinned: {
      type: Boolean,
      default: false,
    },

    isBreaking: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AINews", aiNewsSchema);