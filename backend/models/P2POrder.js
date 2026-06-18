const mongoose = require("mongoose");

const p2pOrderSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true },
    buyerId: { type: String, default: "" },

    asset: {
      type: String,
      default: "USDT",
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
    },

    fiat: {
      type: String,
      default: "USD",
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
    },

    type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },

    price: { type: Number, required: true },
    amount: { type: Number, required: true },
    remaining: { type: Number, required: true },

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

    walletAddress: { type: String, default: "" },
    paymentProof: { type: String, default: "" },

    country: {
      type: String,
      required: true,
      default: "Global",
    },

    countryFlag: {
      type: String,
      default: "🌍",
    },

    status: {
      type: String,
      enum: ["open", "matched", "paid", "released", "cancelled", "disputed"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.P2POrder ||
  mongoose.model("P2POrder", p2pOrderSchema);