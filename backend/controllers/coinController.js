const Coin = require("../models/Coin");
const CoinMarket = require("../models/CoinMarket");
const axios = require("axios");
exports.getCoins = async (req, res) => {
  try {
    const coins = await Coin.find();

    res.json({
      success: true,
      coins,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addCoin = async (req, res) => {
  try {
    const coin = await Coin.create(req.body);

    res.json({
      success: true,
      coin,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.getWeb3Coins = async (req, res) => {
  try {
    const coins = await Coin.find({
      status: "active",
      $or: [
        { marketType: "web3" },
        { marketType: "both" }
      ]
    });

    res.json({
      success: true,
      coins,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMarketCoins = async (req, res) => {
  try {
    const coins = await Coin.find({
      status: "active",
      $or: [
        { marketType: "market" },
        { marketType: "both" }
      ]
    });

    res.json({
      success: true,
      coins,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.syncDexMarketCoins = async (req, res) => {
  try {
      const queries = [
  "bnb","usdt","btc","eth","cake","doge","shib","pepe","xrp","ada",
  "trx","link","sol","avax","matic","arb","op","floki","bonk","wif",
  "ltc","dot","near","atom","apt","sui","inj","fil","sand","mana",
  "uni","aave","crv","comp","1inch","gmt","gala","axs","egld","ftm",
  "rune","blur","mask","bat","ens","snx","cvx","yfi","ldo","rdnt",
  "pendle","jto","pyth","jup","sei","tia","strk","not","ton","kas",
  "bome","meme","people","turbo","mog","babydoge","safemoon","volt",
  "cult","coti","ach","alice","api3","band","celr","dent","dusk",
  "hook","joe","kava","mina","ocean","om","pha","reef","rose","storj",
  "sxp","twt","xvs","zil","zrx","woo","spell","magic","cfx","core"

    ];

    const responses = await Promise.all(
      queries.map((q) =>
        axios.get(`https://api.dexscreener.com/latest/dex/search?q=${q}`)
      )
    );

    const pairs = responses.flatMap((r) => r.data?.pairs || []);
    const saved = {};

    for (const p of pairs) {
      if (p.chainId !== "bsc") continue;

      const address = p.baseToken?.address;
      if (!address || saved[address]) continue;

      const coin = {
        symbol: p.baseToken?.symbol || "UNKNOWN",
        name: p.baseToken?.name || "Unknown Coin",
        chain: "BSC",
        address,
        logo: p.info?.imageUrl || "",
        priceUsd: Number(p.priceUsd || 0),
        liquidityUsd: Number(p.liquidity?.usd || 0),
        volume24h: Number(p.volume?.h24 || 0),
        marketCap: Number(p.marketCap || 0),
        dexId: p.dexId || "",
        pairAddress: p.pairAddress || "",
        url: p.url || "",
        updatedAt: new Date(),
      };

      saved[address] = coin;

      await CoinMarket.findOneAndUpdate(
        { address },
        coin,
        { upsert: true, new: true }
      );
    }

    const coins = await CoinMarket.find().sort({ volume24h: -1 }).limit(1000);

    res.json({
      success: true,
      count: coins.length,
      coins,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllMarketCoins = async (req, res) => {
  try {
    const coins = await CoinMarket.find().sort({ volume24h: -1 }).limit(1000);

    res.json({
      success: true,
      count: coins.length,
      coins,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};