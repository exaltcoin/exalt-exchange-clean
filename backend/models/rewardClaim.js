const mongoose = require("mongoose");

const rewardClaimSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rewardType: {
      type: String,
      enum: ["mining", "referral", "task"],
      required: true,
      index: true,
    },

    taskType: {
      type: String,
      enum: ["none", "telegram", "x_follow", "invite_friend", "custom"],
      default: "none",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    coin: {
      type: String,
      default: "EXALT",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    proofText: {
      type: String,
      default: "",
      trim: true,
    },

    proofUrl: {
      type: String,
      default: "",
      trim: true,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },
   claimDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    ipAddress: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    userAgent: {
      type: String,
      default: "",
      trim: true,
    },

    deviceHash: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    riskFlag: {
      type: Boolean,
      default: false,
      index: true,
    },

    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    riskReason: {
      type: String,
      default: "",
      trim: true,
    },

    adminReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    duplicateIpCount: {
      type: Number,
      default: 0,
    },

    duplicateDeviceCount: {
      type: Number,
      default: 0,
    },

    duplicateAccountCount: {
      type: Number,
      default: 0,
    },

    lastClaimAt: {
      type: Date,
      default: Date.now,
    }, 
  },
  { timestamps: true }
);
rewardClaimSchema.index({
  userId: 1,
  rewardType: 1,
  createdAt: -1,
});

rewardClaimSchema.index({
  status: 1,
  rewardType: 1,
});

rewardClaimSchema.index({
  ipAddress: 1,
});

rewardClaimSchema.index({
  deviceHash: 1,
});

rewardClaimSchema.index({
  riskFlag: 1,
});
module.exports =
  mongoose.models.RewardClaim ||
  mongoose.model("RewardClaim", rewardClaimSchema);