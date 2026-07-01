const mongoose = require("mongoose");

const riskHistorySchema = new mongoose.Schema(
  {
    score: { type: Number, required: true, min: 0, max: 100 },
    level: { type: String, enum: ["Low", "Medium", "High"], required: true },
    status: {
      type: String,
      enum: ["Safe", "Watchlist", "Restricted"],
      default: "Safe",
    },
    reason: { type: String, default: "Risk updated" },
    recommendations: [{ type: String }],
    aiConfidence: { type: Number, default: 90, min: 0, max: 100 },
    createdBy: {
      type: String,
      enum: ["System", "AI", "Admin"],
      default: "AI",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const adminActionSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "Risk Updated",
        "Watchlist Enabled",
        "Watchlist Disabled",
        "Restricted Enabled",
        "Restricted Disabled",
        "Withdrawals Frozen",
        "Withdrawals Unfrozen",
        "P2P Frozen",
        "P2P Unfrozen",
        "KYC Required",
        "KYC Requirement Removed",
        "Profile Deleted",
      ],
      required: true,
    },
    note: { type: String, default: "" },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const riskProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    riskScore: { type: Number, default: 20, min: 0, max: 100 },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    status: {
      type: String,
      enum: ["Safe", "Watchlist", "Restricted"],
      default: "Safe",
    },

    aiConfidence: {
      type: Number,
      default: 90,
      min: 0,
      max: 100,
    },

    accountHealth: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },

    portfolioExposure: {
      type: Number,
      default: 32,
      min: 0,
      max: 100,
    },

    capitalProtection: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },

    suggestedLeverage: {
      type: String,
      default: "3x",
    },

    watchlist: {
      type: Boolean,
      default: false,
    },

    restricted: {
      type: Boolean,
      default: false,
    },

    freezeWithdrawals: {
      type: Boolean,
      default: false,
    },

    freezeP2P: {
      type: Boolean,
      default: false,
    },

    requireKYC: {
      type: Boolean,
      default: false,
    },

    adminNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    recommendations: {
      type: [String],
      default: [
        "Complete KYC verification",
        "Enable strong account security",
        "Avoid suspicious withdrawal activity",
      ],
    },

    factors: {
      kycCompleted: { type: Boolean, default: false },
      suspiciousActivity: { type: Boolean, default: false },
      highWithdrawals: { type: Boolean, default: false },
      p2pDisputes: { type: Number, default: 0 },
      failedLoginAttempts: { type: Number, default: 0 },
      accountAgeRisk: { type: Number, default: 0 },
      tradeRisk: { type: Number, default: 0 },
      withdrawalRisk: { type: Number, default: 0 },
      portfolioConcentration: { type: Number, default: 0 },
    },

    history: { type: [riskHistorySchema], default: [] },

    adminActions: { type: [adminActionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RiskProfile ||
  mongoose.model("RiskProfile", riskProfileSchema);