const mongoose = require("mongoose");

const stakingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    coin: {
      type: String,
      default: "EXALT",
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    apy: {
      type: Number,
      required: true,
      default: 12,
    },

    durationDays: {
      type: Number,
      required: true,
      enum: [30, 60, 90, 180, 365],
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    rewardEarned: {
      type: Number,
      default: 0,
    },

    totalRewardClaimed: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },

    lastClaimAt: {
      type: Date,
      default: Date.now,
    },

    autoRenew: {
      type: Boolean,
      default: false,
    },

    transactionHash: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Staking", stakingSchema);