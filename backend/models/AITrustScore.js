const mongoose = require("mongoose");

const aiTrustScoreSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "EXALT",
      unique: true,
      index: true,
    },

    tokenAddress: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    chain: {
      type: String,
      enum: ["BNB Chain", "Ethereum", "Polygon", "Solana", "Base", "Other"],
      default: "BNB Chain",
      index: true,
    },

    price: { type: Number, default: 0, min: 0 },
    liquidityUSD: { type: Number, default: 0, min: 0 },
    marketCapUSD: { type: Number, default: 0, min: 0 },
    holders: { type: Number, default: 0, min: 0 },

    liquidityScore: { type: Number, default: 50, min: 0, max: 100 },
    holderScore: { type: Number, default: 50, min: 0, max: 100 },
    whaleRiskScore: { type: Number, default: 50, min: 0, max: 100 },
    contractSafetyScore: { type: Number, default: 50, min: 0, max: 100 },
    communityScore: { type: Number, default: 50, min: 0, max: 100 },

    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      index: true,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      index: true,
    },

    status: {
      type: String,
      enum: ["Active", "Reviewed", "Deleted"],
      default: "Active",
      index: true,
    },

    flags: {
      type: [String],
      default: [],
    },

    recommendation: {
      type: String,
      default:
        "Review liquidity, holders, whale risk and contract safety before trading.",
      trim: true,
      maxlength: 1500,
    },

    source: {
      type: String,
      enum: ["DexScreener", "BscScan", "Etherscan", "Hybrid", "Manual"],
      default: "Hybrid",
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

    reviewedAt: {
      type: Date,
      default: null,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

aiTrustScoreSchema.index({
  status: 1,
  trustScore: -1,
});

aiTrustScoreSchema.index({
  chain: 1,
  riskLevel: 1,
});

module.exports =
  mongoose.models.AITrustScore ||
  mongoose.model("AITrustScore", aiTrustScoreSchema);