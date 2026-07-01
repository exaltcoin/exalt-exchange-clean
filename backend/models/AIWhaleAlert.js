const mongoose = require("mongoose");

const aiWhaleAlertSchema = new mongoose.Schema(
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

    alertType: {
      type: String,
      enum: [
        "Buy Pressure",
        "Sell Pressure",
        "Wallet Movement",
        "Extreme Heat Zone",
        "Smart Money Entry",
        "Smart Money Exit",
      ],
      default: "Buy Pressure",
    },

    whaleWallet: {
      type: String,
      default: "",
      trim: true,
    },

    transactionHash: {
      type: String,
      default: "",
      trim: true,
    },

    transactionType: {
      type: String,
      enum: ["Buy", "Sell", "Transfer", "Unknown"],
      default: "Unknown",
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    amountCoin: {
      type: Number,
      default: 0,
      min: 0,
    },

    amountUSD: {
      type: Number,
      default: 0,
      min: 0,
    },

    minAmountUSD: {
      type: Number,
      default: 250000,
      min: 0,
    },

    signal: {
      type: String,
      enum: ["Bullish", "Bearish", "Neutral"],
      default: "Neutral",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    confidence: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },

    message: {
      type: String,
      default: "",
    },

    recommendation: {
      type: String,
      default:
        "AI whale alert detected. Confirm market conditions before taking action.",
    },

    notifyTelegram: {
      type: Boolean,
      default: true,
    },

    notifyEmail: {
      type: Boolean,
      default: false,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    status: {
  type: String,
  enum: ["Active", "Triggered", "Reviewed", "Archived"],
  default: "Active",
  index: true,
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
aiWhaleAlertSchema.index({
  symbol: 1,
  status: 1,
  createdAt: -1,
});

aiWhaleAlertSchema.index({
  priority: 1,
  amountUSD: -1,
});

aiWhaleAlertSchema.index({
  whaleWallet: 1,
  transactionHash: 1,
});
module.exports = mongoose.model("AIWhaleAlert", aiWhaleAlertSchema);