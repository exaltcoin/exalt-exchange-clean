const mongoose = require("mongoose");

const aiLaunchpadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    projectName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    chain: {
      type: String,
      enum: [
        "BNB Chain",
        "Ethereum",
        "Polygon",
        "Solana",
        "Arbitrum",
        "Base",
      ],
      default: "BNB Chain",
      index: true,
    },

    category: {
      type: String,
      enum: [
        "Meme",
        "DeFi",
        "GameFi",
        "AI",
        "RWA",
        "Exchange",
        "Utility",
      ],
      default: "Utility",
      index: true,
    },

    tokenPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    hardCap: {
      type: Number,
      default: 100000,
      min: 0,
    },

    softCap: {
      type: Number,
      default: 50000,
      min: 0,
    },

    raisedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    minBuy: {
      type: Number,
      default: 10,
      min: 0,
    },

    maxBuy: {
      type: Number,
      default: 1000,
      min: 0,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      default: () =>
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },

    aiScore: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
      index: true,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true,
    },

    status: {
      type: String,
      enum: ["Upcoming", "Live", "Ended", "Reviewed", "Rejected"],
      default: "Upcoming",
      index: true,
    },

    verified: {
      type: Boolean,
      default: false,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    auditStatus: {
      type: String,
      enum: ["Pending", "Passed", "Failed"],
      default: "Pending",
    },

    kycStatus: {
      type: String,
      enum: ["Pending", "Passed", "Failed"],
      default: "Pending",
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    telegram: {
      type: String,
      default: "",
      trim: true,
    },

    twitter: {
      type: String,
      default: "",
      trim: true,
    },

    whitepaper: {
      type: String,
      default: "",
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default:
        "AI launchpad project listed for community discovery and review.",
      maxlength: 3000,
    },

    recommendation: {
      type: String,
      default:
        "Review tokenomics, audit, team verification and liquidity plan before participation.",
      maxlength: 3000,
    },

    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
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

    adminNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

aiLaunchpadSchema.index({
  status: 1,
  featured: -1,
  aiScore: -1,
});

aiLaunchpadSchema.index({
  chain: 1,
  category: 1,
});

aiLaunchpadSchema.index({
  symbol: 1,
});

module.exports =
  mongoose.models.AILaunchpad ||
  mongoose.model("AILaunchpad", aiLaunchpadSchema);