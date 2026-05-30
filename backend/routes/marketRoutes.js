const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/live", async (req, res) => {
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: 100,
        page: 1,
        sparkline: false,
      },
      timeout: 10000,
    });

    const pairs = response.data.map((coin) => ({
      pairAddress: coin.id,
      baseToken: {
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
      },
      quoteToken: { symbol: "USD" },
      priceUsd: coin.current_price || 0,
      priceChange: {
        h24: coin.price_change_percentage_24h || 0,
      },
      image: coin.image,
    }));
const dexResponse = await axios.get(
  "https://api.dexscreener.com/token-pairs/v1/bsc/0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78"
);
const exaltPair = Array.isArray(dexResponse.data)
  ? dexResponse.data[0]
  : dexResponse.data?.pairs?.[0];

if (exaltPair) {
  pairs.unshift({
    pairAddress: exaltPair.pairAddress,

    baseToken: {
      symbol: exaltPair.baseToken.symbol,
      name: exaltPair.baseToken.name,
    },

    quoteToken: {
      symbol: exaltPair.quoteToken.symbol,
    },

    priceUsd: Number(exaltPair.priceUsd || 0),

    priceChange: {
      h24: Number(exaltPair.priceChange?.h24 || 0),
    },

    volume: {
      h24: Number(exaltPair.volume?.h24 || 0),
    },

    liquidity: {
      usd: Number(exaltPair.liquidity?.usd || 0),
    },

    image:
      "https://www.exaltcoincommunity.com/logo.png",
  });
}
    return res.json({
      success: true,
      data: { pairs },
    });
  } catch (error) {
    console.log("MARKET ROUTE ERROR:", error.response?.data || error.message);

    return res.json({
      success: true,
      data: {
        pairs: [
          { pairAddress: "bitcoin", baseToken: { symbol: "BTC", name: "Bitcoin" }, quoteToken: { symbol: "USD" }, priceUsd: 73500, priceChange: { h24: -1.2 }, image: "" },
          { pairAddress: "ethereum", baseToken: { symbol: "ETH", name: "Ethereum" }, quoteToken: { symbol: "USD" }, priceUsd: 2020, priceChange: { h24: -1.4 }, image: "" },
          { pairAddress: "binancecoin", baseToken: { symbol: "BNB", name: "BNB" }, quoteToken: { symbol: "USD" }, priceUsd: 640, priceChange: { h24: -1.7 }, image: "" },
          { pairAddress: "ripple", baseToken: { symbol: "XRP", name: "XRP" }, quoteToken: { symbol: "USD" }, priceUsd: 1.33, priceChange: { h24: 0.8 }, image: "" },
          { pairAddress: "solana", baseToken: { symbol: "SOL", name: "Solana" }, quoteToken: { symbol: "USD" }, priceUsd: 82.6, priceChange: { h24: -1.0 }, image: "" },
        ],
      },
    });
  }
});

module.exports = router;