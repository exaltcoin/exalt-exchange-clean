const mongoose = require("mongoose");

const coinMarketSchema = new mongoose.Schema({
  symbol: String,
  name: String,
  chain: String,
  address: {
    type: String,
    unique: true,
  },
  logo: String,
  priceUsd: Number,
  liquidityUsd: Number,
  volume24h: Number,
  marketCap: Number,
  dexId: String,
  pairAddress: String,
  url: String,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CoinMarket", coinMarketSchema);