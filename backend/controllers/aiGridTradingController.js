const AIGridTrading = require("../models/AIGridTrading");

const round = (value, digits = 4) => Number(Number(value || 0).toFixed(digits));

const FALLBACK_PRICES = {
  BTCUSDT: 103000,
  ETHUSDT: 2400,
  SOLUSDT: 135,
  BNBUSDT: 650,
  EXALTUSDT: 0.024,
};

const getMarketPrice = async (symbol = "BTCUSDT") => {
  try {
    const cleanSymbol = String(symbol).replace("/", "").toUpperCase();

    if (cleanSymbol === "EXALTUSDT") {
      return FALLBACK_PRICES.EXALTUSDT;
    }

    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${cleanSymbol}`
    );

    const data = await response.json();
    const price = Number(data.price);

    return price > 0 ? price : FALLBACK_PRICES[cleanSymbol] || 0;
  } catch {
    return FALLBACK_PRICES[symbol] || 0;
  }
};

const calculateGrid = ({ lowerPrice, upperPrice, gridCount, investment }) => {
  lowerPrice = Number(lowerPrice || 0);
  upperPrice = Number(upperPrice || 0);
  gridCount = Number(gridCount || 10);
  investment = Number(investment || 1000);

  if (lowerPrice <= 0 || upperPrice <= 0 || upperPrice <= lowerPrice) {
    return {
      gridStep: 0,
      estimatedProfitPerGrid: 0,
      estimatedDailyProfit: 0,
      estimatedMonthlyProfit: 0,
      riskLevel: "High",
      aiConfidence: 60,
    };
  }

  const gridStep = (upperPrice - lowerPrice) / gridCount;
  const estimatedProfitPerGrid = investment * ((gridStep / lowerPrice) * 0.9);
  const estimatedDailyProfit = estimatedProfitPerGrid * 5;
  const estimatedMonthlyProfit = estimatedDailyProfit * 30;

  const spreadPercent = ((upperPrice - lowerPrice) / lowerPrice) * 100;

  let riskLevel = "Low";
  let aiConfidence = 90;

  if (spreadPercent > 20) {
    riskLevel = "High";
    aiConfidence = 72;
  } else if (spreadPercent > 10) {
    riskLevel = "Medium";
    aiConfidence = 84;
  }

  return {
    gridStep: round(gridStep),
    estimatedProfitPerGrid: round(estimatedProfitPerGrid),
    estimatedDailyProfit: round(estimatedDailyProfit),
    estimatedMonthlyProfit: round(estimatedMonthlyProfit),
    riskLevel,
    aiConfidence,
  };
};

const buildGridSeed = async ({ symbol, baseCoin, gridCount, investment }) => {
  const currentPrice = await getMarketPrice(symbol);

  const lowerPrice = round(currentPrice * 0.97);
  const upperPrice = round(currentPrice * 1.03);

  return {
    user: null,
    symbol,
    baseCoin,
    marketType: "Spot",
    strategyName: `${baseCoin} AI Grid Strategy`,
    lowerPrice,
    upperPrice,
    gridCount,
    investment,
    leverage: 1,
    recommendation:
      "AI grid strategy generated using live Binance market price. Confirm liquidity, volatility and risk before live trading.",
    ...calculateGrid({
      lowerPrice,
      upperPrice,
      gridCount,
      investment,
    }),
  };
};

const seedData = async () => {
  await AIGridTrading.deleteMany({
    user: null,
    symbol: { $in: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"] },
  });

  const seeds = await Promise.all([
    buildGridSeed({
      symbol: "BTCUSDT",
      baseCoin: "BTC",
      gridCount: 20,
      investment: 5000,
    }),
    buildGridSeed({
      symbol: "ETHUSDT",
      baseCoin: "ETH",
      gridCount: 25,
      investment: 3000,
    }),
    buildGridSeed({
      symbol: "SOLUSDT",
      baseCoin: "SOL",
      gridCount: 18,
      investment: 2000,
    }),
    buildGridSeed({
      symbol: "BNBUSDT",
      baseCoin: "BNB",
      gridCount: 16,
      investment: 2000,
    }),
  ]);

  await AIGridTrading.insertMany(seeds);
};

/* USER CREATE */
exports.createGrid = async (req, res) => {
  try {
    const {
      symbol = "BTCUSDT",
      baseCoin = "BTC",
      marketType = "Spot",
      strategyName = "AI Grid Strategy",
      gridCount = 10,
      investment = 1000,
      leverage = 1,
    } = req.body;

    const currentPrice = await getMarketPrice(symbol);

    const lowerPrice = Number(req.body.lowerPrice || round(currentPrice * 0.97));
    const upperPrice = Number(req.body.upperPrice || round(currentPrice * 1.03));

    const data = calculateGrid({
      lowerPrice,
      upperPrice,
      gridCount,
      investment,
    });

    const grid = await AIGridTrading.create({
      user: req.user._id,
      symbol,
      baseCoin,
      marketType,
      strategyName,
      lowerPrice,
      upperPrice,
      gridCount,
      investment,
      leverage,
      ...data,
    });

    res.status(201).json({
      success: true,
      grid,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create grid strategy",
      error: error.message,
    });
  }
};

/* USER GET */
exports.getGridList = async (req, res) => {
  try {
    await seedData();

    const grids = await AIGridTrading.find().sort({
      estimatedMonthlyProfit: -1,
      createdAt: -1,
    });

    res.json({
      success: true,
      grids,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load AI Grid Trading",
      error: error.message,
    });
  }
};

/* FAVORITE */
exports.toggleFavorite = async (req, res) => {
  try {
    const grid = await AIGridTrading.findById(req.params.id);

    if (!grid) {
      return res.status(404).json({
        message: "Grid strategy not found",
      });
    }

    grid.isFavorite = !grid.isFavorite;
    await grid.save();

    res.json({
      success: true,
      grid,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ADMIN */
exports.getAdminGridList = async (req, res) => {
  try {
    await seedData();

    const grids = await AIGridTrading.find()
      .populate("user", "name email role")
      .sort({ estimatedMonthlyProfit: -1, createdAt: -1 });

    res.json({
      success: true,
      grids,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ADMIN STATS */
exports.getGridStats = async (req, res) => {
  try {
    await seedData();

    const all = await AIGridTrading.find();

    res.json({
      success: true,
      stats: {
        total: all.length,
        lowRisk: all.filter((x) => x.riskLevel === "Low").length,
        mediumRisk: all.filter((x) => x.riskLevel === "Medium").length,
        highRisk: all.filter((x) => x.riskLevel === "High").length,
        favorites: all.filter((x) => x.isFavorite).length,
        reviewed: all.filter((x) => x.adminReviewed).length,
        totalMonthlyProfit: round(
          all.reduce(
            (sum, x) => sum + Number(x.estimatedMonthlyProfit || 0),
            0
          )
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};