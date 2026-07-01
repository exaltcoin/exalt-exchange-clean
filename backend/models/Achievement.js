const mongoose = require("mongoose");

const userAchievementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["Trading", "P2P", "KYC", "Referral", "Staking", "Launchpad", "Community", "Security"],
      default: "Community",
    },
    tier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
    },
    xp: { type: Number, default: 10, min: 0 },
    icon: { type: String, default: "🏆" },
    unlocked: { type: Boolean, default: false },
    unlockedAt: { type: Date, default: null },
  },
  { _id: false }
);

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    totalXP: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },

    achievements: {
      type: [userAchievementSchema],
      default: [],
    },

    stats: {
      totalTrades: { type: Number, default: 0 },
      totalDeposits: { type: Number, default: 0 },
      totalReferrals: { type: Number, default: 0 },
      p2pOrders: { type: Number, default: 0 },
      stakingDays: { type: Number, default: 0 },
      launchpadInvestments: { type: Number, default: 0 },
      kycApproved: { type: Boolean, default: false },
    },

    adminNote: { type: String, default: "", maxlength: 1000 },
    lastCheckedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Achievement ||
  mongoose.model("Achievement", achievementSchema);