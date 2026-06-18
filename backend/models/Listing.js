const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
   user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
}, 
    coinName: String,
    symbol: String,
    chain: String,
    network: String,
    contractAddress: String,
    website: String,
    logo: String,
    telegram: String,
    twitter: String,
    bscscan: String,
    chart: String,
    buy: String,
    price: String,
    marketCap: String,
    liquidity: String,
    description: String,
    ownerName: String,
ownerEmail: String,
ownerWallet: String,
projectCategory: String,
whitepaper: String,
safetyScore: {
  type: Number,
  default: 0,
},

riskLevel: {
  type: String,
  enum: ["Low Risk", "Medium Risk", "High Risk"],
  default: "High Risk",
},

checks: {
  kycVerified: {
    type: Boolean,
    default: false,
  },

  liquidityLocked: {
    type: Boolean,
    default: false,
  },

  auditAvailable: {
    type: Boolean,
    default: false,
  },

  websiteVerified: {
    type: Boolean,
    default: false,
  },

  telegramVerified: {
    type: Boolean,
    default: false,
  },

  xVerified: {
    type: Boolean,
    default: false,
  },

  teamVerified: {
    type: Boolean,
    default: false,
  },
},
    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);