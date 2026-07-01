const AIWhaleAlert = require("../models/AIWhaleAlert");
const { getPrice } = require("../services/binanceService");
const { getRealWhaleTransactions } = require("../services/whaleService");

const round = (value, digits = 2) =>
  Number(Number(value || 0).toFixed(digits));

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

const SYMBOL_CONFIG = {
  BTCUSDT: { baseCoin: "BTC", network: "Bitcoin" },
  ETHUSDT: { baseCoin: "ETH", network: "Ethereum" },
  BNBUSDT: { baseCoin: "BNB", network: "BNB Chain" },
  SOLUSDT: { baseCoin: "SOL", network: "Solana" },
  XRPUSDT: { baseCoin: "XRP", network: "Ethereum" },
};

const analyzeAlert = ({ symbol, transactionType, amountUSD }) => {
  let signal = "Neutral";
  let priority = "Medium";
  let riskLevel = "Medium";
  let confidence = 82;

  if (transactionType === "Buy") signal = "Bullish";
  if (transactionType === "Sell") signal = "Bearish";

  if (amountUSD >= 1000000) {
    priority = "Critical";
    riskLevel = transactionType === "Sell" ? "High" : "Medium";
    confidence = 94;
  } else if (amountUSD >= 500000) {
    priority = "High";
    riskLevel = "Medium";
    confidence = 89;
  } else if (amountUSD >= 250000) {
    priority = "Medium";
    riskLevel = "Low";
    confidence = 84;
  }

  const message =
    signal === "Bullish"
      ? `${symbol} whale accumulation detected. Large buy-side activity is increasing.`
      : signal === "Bearish"
      ? `${symbol} whale selling detected. Reduce risk and watch support zones.`
      : `${symbol} large wallet movement detected. Wait for market confirmation.`;

  const recommendation =
    signal === "Bullish"
      ? "Whales are showing accumulation behavior. Confirm trend and avoid over-leverage."
      : signal === "Bearish"
      ? "Whale selling pressure is active. Use stop-loss and reduce exposure."
      : "Whale transfer detected. Monitor follow-up buy/sell pressure before trading.";

  return { signal, priority, riskLevel, confidence, message, recommendation };
};

const buildAlertsFromWhales = async (symbol) => {
  const cleanSymbol = String(symbol || "BTCUSDT").toUpperCase();
  const config = SYMBOL_CONFIG[cleanSymbol] || {
    baseCoin: cleanSymbol.replace("USDT", ""),
    network: "Ethereum",
  };

  const price = Number(getPrice(cleanSymbol.toLowerCase()) || 0);

  const whales = await getRealWhaleTransactions({
    symbol: cleanSymbol,
    network: config.network,
    currentPrice: price,
  });

  const alerts = [];

  for (const whale of whales.slice(0, 5)) {
    const amountUSD = Number(whale.amountUSD || 0);
    if (amountUSD < 250000) continue;

    const analysis = analyzeAlert({
      symbol: cleanSymbol,
      transactionType: whale.transactionType,
      amountUSD,
    });

    const alert = await AIWhaleAlert.findOneAndUpdate(
      {
        symbol: cleanSymbol,
        transactionHash: whale.transactionHash || "",
        whaleWallet: whale.walletAddress || "",
      },
      {
        user: null,
        symbol: cleanSymbol,
        baseCoin: config.baseCoin,
        alertType:
          whale.transactionType === "Buy"
            ? "Buy Pressure"
            : whale.transactionType === "Sell"
            ? "Sell Pressure"
            : "Wallet Movement",
        whaleWallet: whale.walletAddress || "",
        transactionHash: whale.transactionHash || "",
        transactionType: whale.transactionType || "Transfer",
        price,
        amountCoin: round(whale.amountCoin, 6),
        amountUSD: round(amountUSD),
        minAmountUSD: 250000,
        ...analysis,
        status: "Triggered",
      },
      { new: true, upsert: true }
    );

    alerts.push(alert);
  }

  return alerts;
};

/* USER: GET ALERTS */
exports.getWhaleAlerts = async (req, res) => {
  try {
    await Promise.all(SYMBOLS.map((symbol) => buildAlertsFromWhales(symbol)));

    const alerts = await AIWhaleAlert.find()
      .sort({ amountUSD: -1, createdAt: -1 })
      .limit(100);

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load AI whale alerts",
      error: error.message,
    });
  }
};

/* USER: CREATE CUSTOM ALERT */
exports.createWhaleAlert = async (req, res) => {
  try {
    const {
      symbol = "BTCUSDT",
      alertType = "Buy Pressure",
      minAmountUSD = 250000,
      notifyTelegram = true,
      notifyEmail = false,
    } = req.body;

    const cleanSymbol = String(symbol).toUpperCase();
    const config = SYMBOL_CONFIG[cleanSymbol] || {
      baseCoin: cleanSymbol.replace("USDT", ""),
      network: "Ethereum",
    };

    const price = Number(getPrice(cleanSymbol.toLowerCase()) || 0);

    const alert = await AIWhaleAlert.create({
      user: req.user?._id || null,
      symbol: cleanSymbol,
      baseCoin: config.baseCoin,
      alertType,
      price,
      minAmountUSD: Number(minAmountUSD),
      notifyTelegram,
      notifyEmail,
      status: "Active",
      message: `${cleanSymbol} custom whale alert created above $${Number(
        minAmountUSD
      ).toLocaleString()}.`,
    });

    res.status(201).json({
      success: true,
      message: "AI whale alert created",
      alert,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create AI whale alert",
      error: error.message,
    });
  }
};

/* USER: MARK READ */
exports.markWhaleAlertRead = async (req, res) => {
  try {
    const alert = await AIWhaleAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    alert.isRead = true;
    await alert.save();

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* USER: FAVORITE */
exports.toggleFavoriteWhaleAlert = async (req, res) => {
  try {
    const alert = await AIWhaleAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    alert.isFavorite = !alert.isFavorite;
    await alert.save();

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ADMIN: LIST */
exports.getAdminWhaleAlerts = async (req, res) => {
  try {
    await Promise.all(SYMBOLS.map((symbol) => buildAlertsFromWhales(symbol)));

    const alerts = await AIWhaleAlert.find()
      .populate("user", "name email role")
      .sort({ amountUSD: -1, createdAt: -1 });

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load admin whale alerts",
      error: error.message,
    });
  }
};

/* ADMIN: STATS */
exports.getWhaleAlertStats = async (req, res) => {
  try {
    await Promise.all(SYMBOLS.map((symbol) => buildAlertsFromWhales(symbol)));

    const all = await AIWhaleAlert.find();

    res.json({
      success: true,
      stats: {
        total: all.length,
        active: all.filter((x) => x.status === "Active").length,
        triggered: all.filter((x) => x.status === "Triggered").length,
        critical: all.filter((x) => x.priority === "Critical").length,
        bullish: all.filter((x) => x.signal === "Bullish").length,
        bearish: all.filter((x) => x.signal === "Bearish").length,
        unread: all.filter((x) => !x.isRead).length,
        favorites: all.filter((x) => x.isFavorite).length,
        reviewed: all.filter((x) => x.adminReviewed).length,
        totalVolume: round(
          all.reduce((sum, x) => sum + Number(x.amountUSD || 0), 0)
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load whale alert stats",
      error: error.message,
    });
  }
};

/* ADMIN: REVIEW */
exports.reviewWhaleAlert = async (req, res) => {
  try {
    const alert = await AIWhaleAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status || "Reviewed",
        adminNote: req.body.adminNote || "",
        adminReviewed: true,
      },
      { new: true }
    ).populate("user", "name email role");

    if (!alert) return res.status(404).json({ message: "Alert not found" });

    res.json({
      success: true,
      message: "Whale alert reviewed",
      alert,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to review whale alert",
      error: error.message,
    });
  }
};

/* ADMIN: DELETE */
exports.deleteWhaleAlert = async (req, res) => {
  try {
    const alert = await AIWhaleAlert.findById(req.params.id);

    if (!alert) return res.status(404).json({ message: "Alert not found" });

    await alert.deleteOne();

    res.json({
      success: true,
      message: "Whale alert deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete whale alert",
      error: error.message,
    });
  }
};