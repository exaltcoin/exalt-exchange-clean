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
  "sxp","twt","xvs","zil","zrx","woo","spell","magic","cfx","core",
"usdc", "busd", "dai", "fdusd","exaltcoin",
"weth", "wbnb", "tusd",
"ltc", "bch", "etc", "eos", "xtz",
"chz", "enj", "hot", "iotx", "one",
"ankr", "ckb", "lina", "lrc", "skl",
"ankr", "jasmy", "iost", "polyx", "ssv",
"rpl", "fxs", "gmt", "edu", "id",
"arkm", "ace", "manta", "alt", "pixel",
"aevo", "saga", "bb", "zro", "zk",
"lista", "banana", "dogs", "hmstr", "cat",
"neiro", "act", "pnut", "goat", "moodeng"

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
const exaltAddress = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

let exaltPair = null;

try {
  const exaltRes = await axios.get(
    `https://api.dexscreener.com/latest/dex/tokens/${exaltAddress}`
  );

  const exaltPairs = exaltRes.data?.pairs || [];

  exaltPair =
    exaltPairs
      .filter((p) => p.chainId === "bsc")
      .sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0))[0] || null;
} catch (e) {
  console.log("EXALT DexScreener error:", e.message);
}

await CoinMarket.findOneAndUpdate(
  { symbol: "EXALT" },
  {
    symbol: "EXALT",
    name: "Exalt Coin",
    chain: "BSC",
    address: exaltAddress,
    logo: "/logos/exalt.png",
    priceUsd: Number(exaltPair?.priceUsd || 0),
    liquidityUsd: Number(exaltPair?.liquidity?.usd || 0),
    volume24h: Number(exaltPair?.volume?.h24 || 0),
    marketCap: Number(exaltPair?.marketCap || exaltPair?.fdv || 0),
    dexId: exaltPair?.dexId || "pancakeswap",
    pairAddress: exaltPair?.pairAddress || "",
    url: exaltPair?.url || "",
    updatedAt: new Date()
  },
  { upsert: true, new: true }
);
    const coins = await CoinMarket.find().sort({ marketCap: -1, volume24h: -1 }).limit(1000);
coins.sort((a, b) => {
  if (a.symbol === "EXALT") return -1;
  if (b.symbol === "EXALT") return 1;
  return 0;
});
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
const coins = await CoinMarket.find().sort({ marketCap: -1, volume24h: -1 }).limit(1000);
coins.sort((a, b) => {
  if (a.symbol === "EXALT") return -1;
  if (b.symbol === "EXALT") return 1;
  return 0;
});
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