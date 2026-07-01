const express = require("express");
const router = express.Router();
const axios = require("axios");

const EXALT_ADDRESS = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

let marketCache = {
  time: 0,
  data: [],
};

const CACHE_TIME = 15000;

const mainCoins = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "TRXUSDT",
  "TONUSDT",
  "AVAXUSDT",
  "DOTUSDT",
  "LINKUSDT",
  "LTCUSDT",
];

router.get("/live", async (req, res) => {
  try {
    if (Date.now() - marketCache.time < CACHE_TIME && marketCache.data.length) {
      return res.json({
        success: true,
        data: { pairs: marketCache.data },
      });
    }

    const [priceRes, tickerRes] = await Promise.all([
      axios.get("https://api.binance.com/api/v3/ticker/price", {
        timeout: 10000,
      }),
      axios.get("https://api.binance.com/api/v3/ticker/24hr", {
        timeout: 10000,
      }),
    ]);

    const priceMap = {};
    const changeMap = {};

    priceRes.data.forEach((item) => {
      priceMap[item.symbol] = Number(item.price || 0);
    });

    tickerRes.data.forEach((item) => {
      changeMap[item.symbol] = Number(item.priceChangePercent || 0);
    });

    const pairs = mainCoins.map((symbol) => {
      const coinSymbol = symbol.replace("USDT", "");

      return {
        pairAddress: symbol,
        baseToken: {
          symbol: coinSymbol,
          name: coinSymbol,
        },
        quoteToken: { symbol: "USDT" },
        priceUsd: priceMap[symbol] || 0,
        priceChange: {
          h24: changeMap[symbol] || 0,
        },
        image: "",
      };
    });

    try {
      const dexResponse = await axios.get(
        `https://api.dexscreener.com/token-pairs/v1/bsc/${EXALT_ADDRESS}`,
        { timeout: 10000 }
      );

      const exaltPair = Array.isArray(dexResponse.data)
        ? dexResponse.data[0]
        : dexResponse.data?.pairs?.[0];

      if (exaltPair) {
        pairs.unshift({
          pairAddress: exaltPair.pairAddress || EXALT_ADDRESS,
          baseToken: {
            symbol: exaltPair.baseToken?.symbol || "EXALT",
            name: exaltPair.baseToken?.name || "Exalt Coin",
          },
          quoteToken: {
            symbol: exaltPair.quoteToken?.symbol || "USDT",
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
          image: "https://www.exaltcoincommunity.com/logo.png",
        });
      }
    } catch (dexError) {
      console.log("DexScreener EXALT error:", dexError.message);
    }

    marketCache = {
      time: Date.now(),
      data: pairs,
    };

    return res.json({
      success: true,
      data: { pairs },
    });
  } catch (error) {
    console.log("MARKET ROUTE ERROR:", error.message);

    return res.json({
      success: true,
      data: {
        pairs: marketCache.data || [],
      },
    });
  }
});

module.exports = router;