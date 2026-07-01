const mongoose = require("mongoose");

const p2pOrderSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    asset: {
      type: String,
      default: "USDT",
      uppercase: true,
      enum: [
        "EXALT",
        "USDT",
        "BTC",
        "ETH",
        "BNB",
        "TRX",
        "SOL",
        "XRP",
        "DOGE",
        "LTC",
        "ADA",
        "AVAX",
        "TON",
        "LINK",
      ],
      index: true,
    },

    fiat: {
      type: String,
      default: "USD",
      uppercase: true,
      enum: [
        "USD",
        "KWD",
        "PKR",
        "AED",
        "SAR",
        "OMR",
        "QAR",
        "BHD",
        "INR",
        "EUR",
        "GBP",
        "TRY",
        "NGN",
        "PHP",
        "MYR",
        "IDR",
        "AUD",
        "CAD",
        "CNY",
        "JPY",
      ],
      index: true,
    },

    type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    remaining: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: [
        "Bank Transfer",
        "Cash",
        "USDT Wallet",
        "PayPal",
        "Wise",
        "Revolut",
        "Western Union",
        "MoneyGram",
        "Skrill",
        "Payoneer",
        "Apple Pay",
        "Google Pay",
        "Visa",
        "MasterCard",
        "K-Net",
        "STC Pay",
        "Mada",
        "JazzCash",
        "EasyPaisa",
        "NayaPay",
        "Sadapay",
        "Binance Pay",
        "WeChat Pay",
        "Alipay",
        "UPI",
        "IMPS",
        "PhonePe",
        "GCash",
        "Paytm",
        "Crypto Wallet",
        "Local Bank",
        "Mobile Wallet",
      ],
    },

    walletAddress: {
      type: String,
      default: "",
      trim: true,
    },

    paymentProof: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "Global",
      trim: true,
      index: true,
    },

    countryFlag: {
      type: String,
      default: "🌍",
    },

    status: {
      type: String,
      enum: [
        "open",
        "matched",
        "paid",
        "released",
        "cancelled",
        "disputed",
      ],
      default: "open",
      index: true,
    },

    releasedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    disputedAt: {
      type: Date,
      default: null,
    },

    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminRemark: {
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

module.exports =
  mongoose.models.P2POrder ||
  mongoose.model("P2POrder", p2pOrderSchema);