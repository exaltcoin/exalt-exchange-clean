const AIWhaleTracker = require("../models/AIWhaleTracker");

const clamp = (value, min = 0, max = 100) => {
  return Math.min(Math.max(Number(value || 0), min), max);
};

const round = (value) => {
  return Number(Number(value || 0).toFixed(4));
};

const generateWallet = (symbol = "BTC") => {
  return `0x${symbol.toUpperCase()}${Math.random()
    .toString(16)
    .slice(2, 12)}${Date.now().toString(16).slice(-8)}`;
};

const analyzeWhale = ({ transactionType, amountUSD, symbol }) => {
  let aiSignal = "Neutral";
  let riskLevel = "Low";
  let impactLevel = "Low";
  let confidence = 78;

  if (Number(amountUSD) >= 1000000) {
    impactLevel = "High";
    riskLevel = "High";
    confidence = 94;
  } else if (Number(amountUSD) >= 250000) {
    impactLevel = "Medium";
    riskLevel = "Medium";
    confidence = 86;
  }

  if (transactionType === "Buy") aiSignal = "Bullish";
  if (transactionType === "Sell") aiSignal = "Bearish";

  let aiRecommendation = "Monitor whale activity before entering the market.";

  if (aiSignal === "Bullish") {
    aiRecommendation = `Whale buy activity detected on ${symbol}. Possible accumulation signal.`;
  }

  if (aiSignal === "Bearish") {
    aiRecommendation = `Whale sell activity detected on ${symbol}. Use caution and manage risk.`;
  }

  if (impactLevel === "High") {
    aiRecommendation += " High impact whale movement detected.";
  }

  return {
    aiSignal,
    riskLevel,
    impactLevel,
    confidence: clamp(confidence, 50, 97),
    aiRecommendation,
  };
};

const seedWhaleData = async () => {
  const count = await AIWhaleTracker.countDocuments();
  if (count > 0) return;

  const samples = [
    {
      symbol: "BTC",
      network: "Bitcoin",
      walletAddress: "0xBTC92bEA0134FaE821",
      transactionType: "Buy",
      amountUSD: 1488000,
      amountCoin: 24,
      price: 62000,
    },
    {
      symbol: "ETH",
      network: "Ethereum",
      walletAddress: "0xETHc9bE9004eC881",
      transactionType: "Sell",
      amountUSD: 2788000,
      amountCoin: 820,
      price: 3400,
    },
    {
      symbol: "SOL",
      network: "Solana",
      walletAddress: "0xSOLa9BC9921F991",
      transactionType: "Buy",
      amountUSD: 1812500,
      amountCoin: 12500,
      price: 145,
    },
  ];

  const docs = samples.map((item) => ({
    user: null,
    ...item,
    ...analyzeWhale(item),
    reviewed: false,
    status: "Active",
  }));

  await AIWhaleTracker.insertMany(docs);
};

/* USER: CREATE WHALE ALERT */
exports.createWhaleTransaction = async (req, res) => {
  try {
    const {
      symbol = "BTC",
      network = "Ethereum",
      walletAddress,
      transactionType = "Buy",
      amountUSD = 0,
      amountCoin = 0,
      price = 0,
      notes = "",
    } = req.body;

    const analysis = analyzeWhale({
      transactionType,
      amountUSD: Number(amountUSD),
      symbol,
    });

    const transaction = await AIWhaleTracker.create({
      user: req.user._id,
      symbol,
      network,
      walletAddress: walletAddress || generateWallet(symbol),
      transactionType,
      amountUSD: Number(amountUSD),
      amountCoin: Number(amountCoin),
      price: Number(price),
      notes,
      ...analysis,
    });

    res.status(201).json({
      success: true,
      message: "AI whale transaction created",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create whale transaction",
      error: error.message,
    });
  }
};

/* USER: GET WHALE TRANSACTIONS */
exports.getWhaleTransactions = async (req, res) => {
  try {
    await seedWhaleData();

    const { symbol, type, impact, search } = req.query;
    const query = {};

    if (symbol && symbol !== "all") query.symbol = symbol.toUpperCase();
    if (type && type !== "all") query.transactionType = type;
    if (impact && impact !== "all") query.impactLevel = impact;

    if (search) {
      query.$or = [
        { walletAddress: { $regex: search, $options: "i" } },
        { symbol: { $regex: search, $options: "i" } },
        { network: { $regex: search, $options: "i" } },
      ];
    }

    const transactions = await AIWhaleTracker.find(query)
      .sort({ amountUSD: -1, createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get whale transactions",
      error: error.message,
    });
  }
};

/* USER: TOGGLE FAVORITE */
exports.toggleFavoriteWhale = async (req, res) => {
  try {
    const transaction = await AIWhaleTracker.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Whale transaction not found" });
    }

    transaction.isFavorite = !transaction.isFavorite;
    await transaction.save();

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update favorite",
      error: error.message,
    });
  }
};

/* USER: DELETE OWN TRANSACTION */
exports.deleteWhaleTransaction = async (req, res) => {
  try {
    const transaction = await AIWhaleTracker.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Whale transaction not found" });
    }

    if (
      transaction.user &&
      transaction.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not allowed to delete this whale transaction",
      });
    }

    await transaction.deleteOne();

    res.json({
      success: true,
      message: "Whale transaction deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete whale transaction",
      error: error.message,
    });
  }
};

/* ADMIN: GET ALL TRANSACTIONS */
exports.getAllWhaleTransactionsAdmin = async (req, res) => {
  try {
    await seedWhaleData();

    const transactions = await AIWhaleTracker.find()
      .populate("user", "name email role")
      .sort({ amountUSD: -1, createdAt: -1 });

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get admin whale transactions",
      error: error.message,
    });
  }
};

/* ADMIN: STATS */
exports.getWhaleStatsAdmin = async (req, res) => {
  try {
    await seedWhaleData();

    const transactions = await AIWhaleTracker.find();

    const total = transactions.length;
    const buys = transactions.filter((item) => item.transactionType === "Buy").length;
    const sells = transactions.filter((item) => item.transactionType === "Sell").length;
    const highImpact = transactions.filter((item) => item.impactLevel === "High").length;
    const mediumImpact = transactions.filter((item) => item.impactLevel === "Medium").length;
    const lowImpact = transactions.filter((item) => item.impactLevel === "Low").length;
    const reviewed = transactions.filter((item) => item.reviewed).length;
    const favorites = transactions.filter((item) => item.isFavorite).length;

    const totalUsdValue = round(
      transactions.reduce((sum, item) => sum + Number(item.amountUSD || 0), 0)
    );

    res.json({
      success: true,
      stats: {
        total,
        buys,
        sells,
        highImpact,
        mediumImpact,
        lowImpact,
        reviewed,
        favorites,
        totalUsdValue,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get whale stats",
      error: error.message,
    });
  }
};

/* ADMIN: REVIEW TRANSACTION */
exports.reviewWhaleTransactionAdmin = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const transaction = await AIWhaleTracker.findByIdAndUpdate(
      req.params.id,
      {
        reviewed: true,
        status: status || "Active",
        notes: notes || "",
      },
      { new: true }
    ).populate("user", "name email role");

    if (!transaction) {
      return res.status(404).json({ message: "Whale transaction not found" });
    }

    res.json({
      success: true,
      message: "Whale transaction reviewed",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to review whale transaction",
      error: error.message,
    });
  }
};

/* ADMIN: DELETE ANY TRANSACTION */
exports.deleteWhaleTransactionAdmin = async (req, res) => {
  try {
    const transaction = await AIWhaleTracker.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Whale transaction not found" });
    }

    await transaction.deleteOne();

    res.json({
      success: true,
      message: "Whale transaction deleted by admin",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete admin whale transaction",
      error: error.message,
    });
  }
};