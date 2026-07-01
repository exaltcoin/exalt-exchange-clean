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
      enum: ["EXALT", "USDT", "BNB"],
      default: "EXALT",
      uppercase: true,
      trim: true,
      index: true,
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
      min: 0,
    },

    durationDays: {
      type: Number,
      required: true,
      enum: [30, 60, 90, 180, 365],
      index: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    rewardEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalRewardClaimed: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
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
      trim: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

stakingSchema.index({ user: 1, status: 1 });
stakingSchema.index({ user: 1, coin: 1 });

module.exports =
  mongoose.models.Staking ||
  mongoose.model("Staking", stakingSchema);