const AISmartAlert = require("../models/AISmartAlert");

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

    if (cleanSymbol === "EXALTUSDT") return FALLBACK_PRICES.EXALTUSDT;

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

const analyzeAlert = ({ alertType, condition, targetPrice, currentPrice }) => {
  let isTriggered = false;
  let priority = "Medium";
  let riskLevel = "Medium";
  let aiConfidence = 85;

  if (condition === "Above" && currentPrice >= targetPrice) isTriggered = true;
  if (condition === "Below" && currentPrice <= targetPrice) isTriggered = true;
  if (condition === "Spike" || condition === "Drop" || condition === "Detected") {
    isTriggered = true;
  }

  if (alertType === "Risk" || alertType === "Whale") {
    priority = "High";
    riskLevel = "High";
    aiConfidence = 92;
  }

  if (isTriggered) {
    priority = priority === "High" ? "Critical" : "High";
  }

  return {
    isTriggered,
    priority,
    riskLevel,
    aiConfidence,
    status: isTriggered ? "Triggered" : "Active",
  };
};

const buildMessage = ({ symbol, alertType, condition, targetPrice, currentPrice }) => {
  return `${alertType} alert for ${symbol}: condition ${condition} ${
    targetPrice ? `$${targetPrice}` : ""
  }. Current price is $${currentPrice}.`;
};

const seedData = async () => {
  await AISmartAlert.deleteMany({
    user: null,
    symbol: { $in: ["BTCUSDT", "ETHUSDT", "SOLUSDT"] },
  });

  const btcPrice = await getMarketPrice("BTCUSDT");
  const ethPrice = await getMarketPrice("ETHUSDT");
  const solPrice = await getMarketPrice("SOLUSDT");

  const seeds = [
    {
      user: null,
      title: "BTC Breakout Alert",
      symbol: "BTCUSDT",
      alertType: "Price",
      condition: "Above",
      targetPrice: round(btcPrice * 1.01),
      currentPrice: round(btcPrice),
    },
    {
      user: null,
      title: "ETH Support Alert",
      symbol: "ETHUSDT",
      alertType: "Price",
      condition: "Below",
      targetPrice: round(ethPrice * 0.99),
      currentPrice: round(ethPrice),
    },
    {
      user: null,
      title: "SOL Whale Activity",
      symbol: "SOLUSDT",
      alertType: "Whale",
      condition: "Detected",
      targetPrice: 0,
      currentPrice: round(solPrice),
    },
  ];

  const docs = seeds.map((item) => ({
    ...item,
    ...analyzeAlert(item),
    message: buildMessage(item),
    recommendation:
      "AI smart alert generated using live market price. Confirm market conditions before taking action.",
  }));

  await AISmartAlert.insertMany(docs);
};

/* USER: CREATE ALERT */
exports.createSmartAlert = async (req, res) => {
  try {
    const {
      title,
      symbol = "BTCUSDT",
      alertType = "Price",
      condition = "Above",
      targetPrice = 0,
    } = req.body;

    const currentPrice = await getMarketPrice(symbol);

    const analysis = analyzeAlert({
      alertType,
      condition,
      targetPrice: Number(targetPrice),
      currentPrice,
    });

    const alert = await AISmartAlert.create({
      user: req.user._id,
      title: title || `${symbol} AI Smart Alert`,
      symbol,
      alertType,
      condition,
      targetPrice: Number(targetPrice),
      currentPrice: round(currentPrice),
      message: buildMessage({
        symbol,
        alertType,
        condition,
        targetPrice,
        currentPrice: round(currentPrice),
      }),
      ...analysis,
    });

    res.status(201).json({
      success: true,
      message: "AI smart alert created",
      alert,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create AI smart alert",
      error: error.message,
    });
  }
};

/* USER: GET ALERTS */
exports.getSmartAlerts = async (req, res) => {
  try {
    await seedData();

    const alerts = await AISmartAlert.find().sort({
      isTriggered: -1,
      priority: -1,
      createdAt: -1,
    });

    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load AI Smart Alerts",
      error: error.message,
    });
  }
};

/* USER: MARK READ */
exports.markAlertRead = async (req, res) => {
  try {
    const alert = await AISmartAlert.findById(req.params.id);

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
exports.toggleFavoriteAlert = async (req, res) => {
  try {
    const alert = await AISmartAlert.findById(req.params.id);

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
exports.getAdminSmartAlerts = async (req, res) => {
  try {
    await seedData();

    const alerts = await AISmartAlert.find()
      .populate("user", "name email role")
      .sort({ isTriggered: -1, createdAt: -1 });

    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ADMIN: STATS */
exports.getSmartAlertStats = async (req, res) => {
  try {
    await seedData();

    const all = await AISmartAlert.find();

    res.json({
      success: true,
      stats: {
        total: all.length,
        active: all.filter((x) => x.status === "Active").length,
        triggered: all.filter((x) => x.status === "Triggered").length,
        critical: all.filter((x) => x.priority === "Critical").length,
        high: all.filter((x) => x.priority === "High").length,
        unread: all.filter((x) => !x.isRead).length,
        favorites: all.filter((x) => x.isFavorite).length,
        reviewed: all.filter((x) => x.adminReviewed).length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ADMIN: REVIEW */
exports.reviewSmartAlert = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const alert = await AISmartAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: status || "Reviewed",
        adminNote: adminNote || "",
        adminReviewed: true,
      },
      { new: true }
    ).populate("user", "name email role");

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.json({
      success: true,
      message: "AI smart alert reviewed",
      alert,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to review alert",
      error: error.message,
    });
  }
};

/* ADMIN: DELETE */
exports.deleteSmartAlert = async (req, res) => {
  try {
    const alert = await AISmartAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    await alert.deleteOne();

    res.json({
      success: true,
      message: "AI smart alert deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete alert",
      error: error.message,
    });
  }
};