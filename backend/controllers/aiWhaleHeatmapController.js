const AIWhaleHeatmap = require("../models/AIWhaleHeatmap");
const { getPrice } = require("../services/binanceService");
const { getRealWhaleTransactions } = require("../services/whaleService");
const { calculateHeatmap } = require("../services/heatmapService");

const SYMBOL_CONFIG = {
  BTCUSDT: { baseCoin: "BTC", network: "Bitcoin" },
  ETHUSDT: { baseCoin: "ETH", network: "Ethereum" },
  BNBUSDT: { baseCoin: "BNB", network: "BNB Chain" },
  SOLUSDT: { baseCoin: "SOL", network: "Solana" },
  XRPUSDT: { baseCoin: "XRP", network: "Ethereum" },
};

const getSafePrice = (symbol) => {
  const price = getPrice(String(symbol).toLowerCase());
  return Number(price || 0);
};

const splitWhaleVolumes = (wallets = []) => {
  let buyVolumeUSD = 0;
  let sellVolumeUSD = 0;
  let transferVolumeUSD = 0;

  wallets.forEach((wallet) => {
    const amountUSD = Number(wallet.amountUSD || 0);

    if (wallet.transactionType === "Buy") buyVolumeUSD += amountUSD;
    else if (wallet.transactionType === "Sell") sellVolumeUSD += amountUSD;
    else transferVolumeUSD += amountUSD;
  });

  return { buyVolumeUSD, sellVolumeUSD, transferVolumeUSD };
};

const createOrUpdateHeatmap = async (symbol) => {
  const cleanSymbol = String(symbol || "BTCUSDT").replace("/", "").toUpperCase();
  const config = SYMBOL_CONFIG[cleanSymbol] || {
    baseCoin: cleanSymbol.replace("USDT", ""),
    network: "Ethereum",
  };

  const currentPrice = getSafePrice(cleanSymbol);

  const wallets = await getRealWhaleTransactions({
    symbol: cleanSymbol,
    network: config.network,
    currentPrice,
  });

  const { buyVolumeUSD, sellVolumeUSD, transferVolumeUSD } =
    splitWhaleVolumes(wallets);

  const heatmapData = calculateHeatmap({
    currentPrice,
    buyVolumeUSD,
    sellVolumeUSD,
    transferVolumeUSD,
    wallets,
  });

  const heatmap = await AIWhaleHeatmap.findOneAndUpdate(
    { symbol: cleanSymbol },
    {
      symbol: cleanSymbol,
      baseCoin: config.baseCoin,
      network: config.network,
      wallets,
      source: "Hybrid",
      lastSyncedAt: new Date(),
      ...heatmapData,
    },
    { new: true, upsert: true }
  );

  return heatmap;
};

/* USER: GET HEATMAP */
exports.getWhaleHeatmap = async (req, res) => {
  try {
    const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

    const heatmaps = await Promise.all(
      symbols.map((symbol) => createOrUpdateHeatmap(symbol))
    );

    res.json({
      success: true,
      heatmaps,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load AI Whale Heatmap",
      error: error.message,
    });
  }
};

/* USER: SYNC ONE SYMBOL */
exports.syncWhaleHeatmapSymbol = async (req, res) => {
  try {
    const symbol = req.params.symbol || "BTCUSDT";
    const heatmap = await createOrUpdateHeatmap(symbol);

    res.json({
      success: true,
      message: "Whale heatmap synced",
      heatmap,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to sync whale heatmap",
      error: error.message,
    });
  }
};

/* USER: FAVORITE */
exports.toggleFavoriteHeatmap = async (req, res) => {
  try {
    const heatmap = await AIWhaleHeatmap.findById(req.params.id);

    if (!heatmap) {
      return res.status(404).json({ message: "Heatmap not found" });
    }

    heatmap.isFavorite = !heatmap.isFavorite;
    await heatmap.save();

    res.json({
      success: true,
      heatmap,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update favorite",
      error: error.message,
    });
  }
};

/* ADMIN: LIST */
exports.getAdminWhaleHeatmap = async (req, res) => {
  try {
    const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

    await Promise.all(symbols.map((symbol) => createOrUpdateHeatmap(symbol)));

    const heatmaps = await AIWhaleHeatmap.find().sort({
      whaleScore: -1,
      totalWhaleVolumeUSD: -1,
      updatedAt: -1,
    });

    res.json({
      success: true,
      heatmaps,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load admin whale heatmap",
      error: error.message,
    });
  }
};

/* ADMIN: STATS */
exports.getWhaleHeatmapStats = async (req, res) => {
  try {
   const symbols = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
];

await Promise.all(
  symbols.map((symbol) => createOrUpdateHeatmap(symbol))
); 
    const heatmaps = await AIWhaleHeatmap.find();

    const totalVolume = heatmaps.reduce(
      (sum, item) => sum + Number(item.totalWhaleVolumeUSD || 0),
      0
    );

    res.json({
      success: true,
      stats: {
        totalAssets: heatmaps.length,
        hotZones: heatmaps.filter((x) => x.heatLevel === "Hot").length,
        extremeZones: heatmaps.filter((x) => x.heatLevel === "Extreme").length,
        bullish: heatmaps.filter((x) => x.signal === "Bullish").length,
        bearish: heatmaps.filter((x) => x.signal === "Bearish").length,
        highRisk: heatmaps.filter((x) => x.riskLevel === "High").length,
        reviewed: heatmaps.filter((x) => x.adminReviewed).length,
        totalVolume,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load whale heatmap stats",
      error: error.message,
    });
  }
};

/* ADMIN: REVIEW */
exports.reviewWhaleHeatmap = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const heatmap = await AIWhaleHeatmap.findByIdAndUpdate(
      req.params.id,
      {
        status: status || "Reviewed",
        adminNote: adminNote || "",
        adminReviewed: true,
      },
      { new: true }
    );

    if (!heatmap) {
      return res.status(404).json({ message: "Heatmap not found" });
    }

    res.json({
      success: true,
      message: "Whale heatmap reviewed",
      heatmap,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to review whale heatmap",
      error: error.message,
    });
  }
};

/* ADMIN: DELETE */
exports.deleteWhaleHeatmap = async (req, res) => {
  try {
    const heatmap = await AIWhaleHeatmap.findById(req.params.id);

    if (!heatmap) {
      return res.status(404).json({ message: "Heatmap not found" });
    }

    await heatmap.deleteOne();

    res.json({
      success: true,
      message: "Whale heatmap deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete whale heatmap",
      error: error.message,
    });
  }
};