const mongoose = require("mongoose");

const aiArbitrageScannerSchema = new mongoose.Schema(
  {
   user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
  index: true,
}, 

   symbol: {
  type: String,
  required: true,
  uppercase: true,
  trim: true,
  default: "BTCUSDT",
  index: true,
},
    baseCoin: {
      type: String,
      uppercase: true,
      trim: true,
      default: "BTC",
    },

    buyExchange: {
      type: String,
      required: true,
      trim: true,
      default: "KuCoin",
    },

    sellExchange: {
      type: String,
      required: true,
      trim: true,
      default: "Binance",
    },

    buyPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    capital: {
      type: Number,
      default: 1000,
      min: 0,
    },

    spreadPercent: {
      type: Number,
      default: 0,
    },

    estimatedProfit: {
      type: Number,
      default: 0,
    },

    estimatedFees: {
      type: Number,
      default: 0,
    },

    netProfit: {
      type: Number,
      default: 0,
    },

    aiConfidence: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    opportunityType: {
      type: String,
      enum: ["Spot", "Futures", "DEX", "CEX", "Cross Exchange"],
      default: "Cross Exchange",
    },

   status: {
  type: String,
  enum: ["Active", "Expired", "Reviewed", "Flagged"],
  default: "Active",
  index: true,
},

    recommendation: {
      type: String,
      default:
        "Arbitrage opportunity detected. Confirm liquidity, withdrawal fees and execution speed before trading.",
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    adminReviewed: {
      type: Boolean,
      default: false,
    },

    adminNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true }
);
aiArbitrageScannerSchema.index({
  symbol: 1,
  status: 1,
  createdAt: -1,
});

aiArbitrageScannerSchema.index({
  netProfit: -1,
  riskLevel: 1,
});

aiArbitrageScannerSchema.index({
  buyExchange: 1,
  sellExchange: 1,
});
module.exports = mongoose.model(
  "AIArbitrageScanner",
  aiArbitrageScannerSchema
);