const mongoose = require("mongoose");

const traderProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    displayName: {
      type: String,
      trim: true,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    totalTrades: {
      type: Number,
      default: 0,
    },

    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    roi: {
      type: Number,
      default: 0,
    },

    profit: {
      type: Number,
      default: 0,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    verifiedTrader: {
      type: Boolean,
      default: false,
    },

    rank: {
      type: Number,
      default: 0,
    },

    badges: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TraderProfile", traderProfileSchema);