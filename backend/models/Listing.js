const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);