const mongoose = require("mongoose");

const traderProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    displayName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 80,
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
      trim: true,
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
      min: 0,
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
      index: true,
    },

    verifiedTrader: {
      type: Boolean,
      default: false,
      index: true,
    },

    followersCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    postsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    rank: {
      type: Number,
      default: 0,
      min: 0,
    },

    badges: {
      type: [String],
      default: [],
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

traderProfileSchema.index({ verifiedTrader: 1 });
traderProfileSchema.index({ roi: -1 });
traderProfileSchema.index({ winRate: -1 });
traderProfileSchema.index({ profit: -1 });

module.exports =
  mongoose.models.TraderProfile ||
  mongoose.model("TraderProfile", traderProfileSchema);