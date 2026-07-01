const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    coinName: { type: String, required: true, trim: true, maxlength: 100 },
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    chain: { type: String, default: "BNB Smart Chain", trim: true },
    network: { type: String, default: "BSC", uppercase: true, trim: true, index: true },

    contractAddress: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    website: { type: String, default: "", trim: true },
   logo: { type: String, default: "", trim: true },
logoUrl: { type: String, default: "", trim: true },
image: { type: String, default: "", trim: true },
icon: { type: String, default: "", trim: true },
    telegram: { type: String, default: "", trim: true },
    twitter: { type: String, default: "", trim: true },
    bscscan: { type: String, default: "", trim: true },
    chart: { type: String, default: "", trim: true },
    buy: { type: String, default: "", trim: true },

    price: { type: String, default: "" },
    marketCap: { type: String, default: "" },
    liquidity: { type: String, default: "" },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 3000,
    },

    ownerName: { type: String, default: "", trim: true },
    ownerEmail: { type: String, default: "", lowercase: true, trim: true, index: true },
    ownerWallet: { type: String, default: "", trim: true },
    projectCategory: { type: String, default: "Other", trim: true },
    whitepaper: { type: String, default: "", trim: true },

    safetyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    riskLevel: {
      type: String,
      enum: ["Low Risk", "Medium Risk", "High Risk"],
      default: "High Risk",
      index: true,
    },

    checks: {
      kycVerified: { type: Boolean, default: false },
      liquidityLocked: { type: Boolean, default: false },
      auditAvailable: { type: Boolean, default: false },
      websiteVerified: { type: Boolean, default: false },
      telegramVerified: { type: Boolean, default: false },
      xVerified: { type: Boolean, default: false },
      teamVerified: { type: Boolean, default: false },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "listed", "delisted"],
      default: "pending",
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
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
  },
  { timestamps: true }
);

listingSchema.index({ symbol: 1, network: 1 });
listingSchema.index({ contractAddress: 1, network: 1 }, { unique: true });

module.exports =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);