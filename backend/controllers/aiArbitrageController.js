const AIArbitrageScanner = require("../models/AIArbitrageScanner");

const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

const FALLBACK_PRICES = {
  BTCUSDT: 103000,
  ETHUSDT: 2400,
  SOLUSDT: 135,
  BNBUSDT: 650,
  EXALTUSDT: 0.024,
};

const getMarketPrice = async (symbol) => {
  try {
    if (symbol === "EXALTUSDT") return FALLBACK_PRICES.EXALTUSDT;

    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    );

    const data = await res.json();
    return Number(data.price || FALLBACK_PRICES[symbol] || 0);
  } catch {
    return FALLBACK_PRICES[symbol] || 0;
  }
};

const calculateOpportunity = ({ buyPrice, sellPrice, capital }) => {
  buyPrice = Number(buyPrice || 0);
  sellPrice = Number(sellPrice || 0);
  capital = Number(capital || 0);

  const spreadPercent =
    buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

  const estimatedProfit = capital * (spreadPercent / 100);
  const estimatedFees = capital * 0.002;
  const netProfit = estimatedProfit - estimatedFees;

  let riskLevel = "Low";
  let aiConfidence = 90;

  if (netProfit <= 0 || spreadPercent < 0.25) {
    riskLevel = "High";
    aiConfidence = 68;
  } else if (spreadPercent < 0.75) {
    riskLevel = "Medium";
    aiConfidence = 82;
  }

  return {
    spreadPercent: round(spreadPercent),
    estimatedProfit: round(estimatedProfit),
    estimatedFees: round(estimatedFees),
    netProfit: round(netProfit),
    riskLevel,
    aiConfidence,
    status: netProfit > 0 ? "Active" : "Expired",
  };
};

const buildSeedOpportunity = async ({
  symbol,
  baseCoin,
  buyExchange,
  sellExchange,
  capital,
  spread,
}) => {
  const marketPrice = await getMarketPrice(symbol);

  const buyPrice = round(marketPrice * (1 - spread / 2), 4);
  const sellPrice = round(marketPrice * (1 + spread / 2), 4);

  return {
    user: null,
    symbol,
    baseCoin,
    buyExchange,
    sellExchange,
    buyPrice,
    sellPrice,
    capital,
    opportunityType: "Cross Exchange",
    recommendation:
      "AI arbitrage opportunity detected. Confirm real liquidity, withdrawal fees and execution speed before trading.",
    ...calculateOpportunity({ buyPrice, sellPrice, capital }),
  };
};

const seedData = async () => {
  await AIArbitrageScanner.deleteMany({
    user: null,
    symbol: { $in: ["BTCUSDT", "ETHUSDT", "SOLUSDT"] },
  });

  const seeds = await Promise.all([
    buildSeedOpportunity({
      symbol: "BTCUSDT",
      baseCoin: "BTC",
      buyExchange: "KuCoin",
      sellExchange: "Binance",
      capital: 5000,
      spread: 0.0038,
    }),
    buildSeedOpportunity({
      symbol: "ETHUSDT",
      baseCoin: "ETH",
      buyExchange: "Bybit",
      sellExchange: "OKX",
      capital: 3000,
      spread: 0.0045,
    }),
    buildSeedOpportunity({
      symbol: "SOLUSDT",
      baseCoin: "SOL",
      buyExchange: "MEXC",
      sellExchange: "Binance",
      capital: 2000,
      spread: 0.006,
    }),
  ]);

  await AIArbitrageScanner.insertMany(seeds);
};

/* USER CREATE */
exports.createArbitrage = async (req, res) => {
  try {
    const {
      symbol = "BTCUSDT",
      baseCoin = "BTC",
      buyExchange = "KuCoin",
      sellExchange = "Binance",
      buyPrice,
      sellPrice,
      capital = 1000,
    } = req.body;

    const data = calculateOpportunity({ buyPrice, sellPrice, capital });

    const arbitrage = await AIArbitrageScanner.create({
      user: req.user._id,
      symbol,
      baseCoin,
      buyExchange,
      sellExchange,
      buyPrice,
      sellPrice,
      capital,
      ...data,
    });

    res.status(201).json({ success: true, arbitrage });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create arbitrage",
      error: error.message,
    });
  }
};

/* USER GET */
exports.getArbitrageList = async (req, res) => {
  try {
    await seedData();

    const arbitrages = await AIArbitrageScanner.find().sort({
      netProfit: -1,
      createdAt: -1,
    });

    res.json({ success: true, arbitrages });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load arbitrage data",
      error: error.message,
    });
  }
};

/* FAVORITE */
exports.toggleFavorite = async (req, res) => {
  try {
    const item = await AIArbitrageScanner.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    item.isFavorite = !item.isFavorite;
    await item.save();

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ADMIN */
exports.getAdminArbitrage = async (req, res) => {
  try {
    await seedData();

    const arbitrages = await AIArbitrageScanner.find()
      .populate("user", "name email role")
      .sort({ netProfit: -1, createdAt: -1 });

    res.json({ success: true, arbitrages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ADMIN STATS */
exports.getArbitrageStats = async (req, res) => {
  try {
    await seedData();

    const all = await AIArbitrageScanner.find();

    const stats = {
      total: all.length,
      lowRisk: all.filter((x) => x.riskLevel === "Low").length,
      mediumRisk: all.filter((x) => x.riskLevel === "Medium").length,
      highRisk: all.filter((x) => x.riskLevel === "High").length,
      favorites: all.filter((x) => x.isFavorite).length,
      reviewed: all.filter((x) => x.adminReviewed).length,
      totalProfit: round(all.reduce((sum, x) => sum + Number(x.netProfit || 0), 0)),
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};