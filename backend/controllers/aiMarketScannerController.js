const AIMarketScan = require("../models/AIMarketScan");

const clamp = (value, min = 0, max = 100) => {
  return Math.min(Math.max(Number(value || 0), min), max);
};

const round = (value) => {
  return Number(Number(value || 0).toFixed(4));
};

const normalizeSymbol = (symbol = "BTCUSDT") => {
  return String(symbol).replace("/", "").toUpperCase().trim();
};

const getMockMarketPrice = (symbol) => {
  const prices = {
    BTCUSDT: 62000,
    ETHUSDT: 3400,
    BNBUSDT: 600,
    SOLUSDT: 145,
    XRPUSDT: 0.52,
    DOGEUSDT: 0.12,
    EXALTUSDT: 0.024,
  };

  return prices[symbol] || 100;
};

const calculateIndicators = (symbol, timeframe) => {
  const seed =
    symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) +
    timeframe.length * 7;

  const rsi = clamp(35 + (seed % 45), 20, 85);

  const macd =
    rsi >= 58 ? "Bullish" : rsi <= 42 ? "Bearish" : "Neutral";

  const emaTrend =
    rsi >= 55 ? "Bullish" : rsi <= 45 ? "Bearish" : "Neutral";

  const volumeSignal =
    rsi >= 65 ? "High" : rsi <= 38 ? "Low" : "Normal";

  const volatility =
    rsi >= 70 || rsi <= 30 ? "High" : rsi >= 55 || rsi <= 45 ? "Medium" : "Low";

  return {
    rsi,
    macd,
    emaTrend,
    volumeSignal,
    volatility,
  };
};

const calculateScan = ({ symbol, timeframe, marketType }) => {
  const cleanSymbol = normalizeSymbol(symbol);
  const currentPrice = getMockMarketPrice(cleanSymbol);
  const indicators = calculateIndicators(cleanSymbol, timeframe);

  let trend = "Neutral";
  let signal = "Hold";

  if (
    indicators.rsi >= 58 &&
    indicators.macd === "Bullish" &&
    indicators.emaTrend === "Bullish"
  ) {
    trend = "Bullish";
    signal = "Buy";
  }

  if (
    indicators.rsi <= 42 &&
    indicators.macd === "Bearish" &&
    indicators.emaTrend === "Bearish"
  ) {
    trend = "Bearish";
    signal = "Sell";
  }

  const trendStrength =
    trend === "Bullish"
      ? clamp(indicators.rsi + 10)
      : trend === "Bearish"
      ? clamp(100 - indicators.rsi + 10)
      : clamp(50 + Math.abs(indicators.rsi - 50));

  const aiConfidence = clamp(
    trendStrength + (indicators.volumeSignal === "High" ? 8 : 0) - 
      (indicators.volatility === "High" ? 8 : 0),
    50,
    97
  );

  const riskLevel =
    indicators.volatility === "High" || aiConfidence < 60
      ? "High"
      : indicators.volatility === "Medium"
      ? "Medium"
      : "Low";

  const buyZone =
    signal === "Buy"
      ? round(currentPrice * 0.995)
      : round(currentPrice * 0.985);

  const sellZone =
    signal === "Sell"
      ? round(currentPrice * 1.005)
      : round(currentPrice * 1.025);

  const stopLoss =
    signal === "Buy"
      ? round(currentPrice * 0.975)
      : signal === "Sell"
      ? round(currentPrice * 1.025)
      : round(currentPrice * 0.97);

  const takeProfit =
    signal === "Buy"
      ? round(currentPrice * 1.035)
      : signal === "Sell"
      ? round(currentPrice * 0.965)
      : round(currentPrice * 1.02);

  let recommendation = "Wait for stronger confirmation before entering the market.";

  if (signal === "Buy") {
    recommendation =
      "Bullish setup detected. Consider buy zone with proper stop loss and position sizing.";
  }

  if (signal === "Sell") {
    recommendation =
      "Bearish setup detected. Avoid long entries or consider short setup with tight risk control.";
  }

  if (riskLevel === "High") {
    recommendation += " High volatility detected. Reduce trade size.";
  }

  return {
    symbol: cleanSymbol,
    timeframe,
    marketType,
    currentPrice,
    buyZone,
    sellZone,
    stopLoss,
    takeProfit,
    trend,
    signal,
    trendStrength,
    aiConfidence,
    riskLevel,
    indicators,
    recommendation,
  };
};

/* USER: CREATE MARKET SCAN */
exports.createMarketScan = async (req, res) => {
  try {
    const { symbol = "BTCUSDT", timeframe = "1h", marketType = "Spot" } = req.body;

    const result = calculateScan({ symbol, timeframe, marketType });

    const scan = await AIMarketScan.create({
      user: req.user._id,
      ...result,
    });

    res.status(201).json({
      success: true,
      message: "AI market scan completed",
      scan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create market scan",
      error: error.message,
    });
  }
};

/* USER: GET MY SCANS */
exports.getMyMarketScans = async (req, res) => {
  try {
    const scans = await AIMarketScan.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      scans,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get market scans",
      error: error.message,
    });
  }
};

/* USER: TOGGLE FAVORITE */
exports.toggleFavoriteScan = async (req, res) => {
  try {
    const scan = await AIMarketScan.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({ message: "Market scan not found" });
    }

    scan.isFavorite = !scan.isFavorite;
    await scan.save();

    res.json({
      success: true,
      scan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update favorite scan",
      error: error.message,
    });
  }
};

/* USER: DELETE MY SCAN */
exports.deleteMyMarketScan = async (req, res) => {
  try {
    const scan = await AIMarketScan.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({ message: "Market scan not found" });
    }

    await scan.deleteOne();

    res.json({
      success: true,
      message: "Market scan deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete market scan",
      error: error.message,
    });
  }
};

/* ADMIN: GET ALL SCANS */
exports.getAllMarketScansAdmin = async (req, res) => {
  try {
    const scans = await AIMarketScan.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      scans,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get admin market scans",
      error: error.message,
    });
  }
};

/* ADMIN: GET STATS */
exports.getMarketScannerStatsAdmin = async (req, res) => {
  try {
    const scans = await AIMarketScan.find();

    const total = scans.length;
    const buySignals = scans.filter((item) => item.signal === "Buy").length;
    const sellSignals = scans.filter((item) => item.signal === "Sell").length;
    const holdSignals = scans.filter((item) => item.signal === "Hold").length;
    const highRisk = scans.filter((item) => item.riskLevel === "High").length;
    const mediumRisk = scans.filter((item) => item.riskLevel === "Medium").length;
    const lowRisk = scans.filter((item) => item.riskLevel === "Low").length;
    const reviewed = scans.filter((item) => item.adminReviewed).length;

    res.json({
      success: true,
      stats: {
        total,
        buySignals,
        sellSignals,
        holdSignals,
        highRisk,
        mediumRisk,
        lowRisk,
        reviewed,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get market scanner stats",
      error: error.message,
    });
  }
};

/* ADMIN: REVIEW SCAN */
exports.reviewMarketScanAdmin = async (req, res) => {
  try {
    const { adminNote, status } = req.body;

    const scan = await AIMarketScan.findByIdAndUpdate(
      req.params.id,
      {
        adminReviewed: true,
        adminNote: adminNote || "",
        status: status || "Reviewed",
      },
      { new: true }
    ).populate("user", "name email role");

    if (!scan) {
      return res.status(404).json({ message: "Market scan not found" });
    }

    res.json({
      success: true,
      message: "Market scan reviewed",
      scan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to review market scan",
      error: error.message,
    });
  }
};

/* ADMIN: DELETE ANY SCAN */
exports.deleteMarketScanAdmin = async (req, res) => {
  try {
    const scan = await AIMarketScan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({ message: "Market scan not found" });
    }

    await scan.deleteOne();

    res.json({
      success: true,
      message: "Market scan deleted by admin",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete admin market scan",
      error: error.message,
    });
  }
};