const mongoose = require("mongoose");

const coinSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    symbol: { type: String, required: true, uppercase: true },

    pair: { type: String, default: "USDT" },

    chain: { type: String, default: "BSC" },

    contractAddress: { type: String, default: "" },

    decimals: { type: Number, default: 18 },

    logo: { type: String, default: "" },

    price: { type: Number, default: 0 },

    marketType: {
      type: String,
      enum: ["web3", "market", "both"],
      default: "web3",
    },

    isListed: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coin", coinSchema);