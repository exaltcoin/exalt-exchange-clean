const AIPortfolio = require("../models/AIPortfolio");

const defaultAssets = [
  { symbol: "BTC", name: "Bitcoin", balance: 0.015, value: 1050, allocation: 42, change24h: 1.8 },
  { symbol: "ETH", name: "Ethereum", balance: 0.45, value: 720, allocation: 29, change24h: -0.7 },
  { symbol: "BNB", name: "BNB", balance: 2.1, value: 520, allocation: 21, change24h: 0.9 },
  { symbol: "EXALT", name: "Exalt Coin", balance: 15000, value: 210, allocation: 8, change24h: 4.2 },
];

const defaultSuggestions = [
  {
    title: "Portfolio Diversification",
    message: "Your portfolio is balanced, but BTC exposure is slightly high.",
    type: "info",
  },
  {
    title: "Risk Control",
    message: "Current AI risk score is moderate. Avoid increasing high-risk assets.",
    type: "warning",
  },
  {
    title: "EXALT Opportunity",
    message: "EXALT allocation is still low. Consider gradual accumulation if your strategy allows.",
    type: "success",
  },
];

const buildPortfolio = async (userId) => {
  let portfolio = await AIPortfolio.findOne({ userId });

  if (!portfolio) {
    portfolio = await AIPortfolio.create({
      userId,
      totalValue: 2500,
      totalProfitLoss: 145,
      riskScore: 38,
      diversification: 72,
      assets: defaultAssets,
      suggestions: defaultSuggestions,
      history: [
        {
          totalValue: 2500,
          riskScore: 38,
          totalProfitLoss: 145,
        },
      ],
    });
  }

  return portfolio;
};

const getMyPortfolio = async (req, res) => {
  try {
    const portfolio = await buildPortfolio(req.user._id);

    res.json({
      success: true,
      portfolio,
    });
  } catch (error) {
    console.error("Get My Portfolio Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load AI portfolio",
    });
  }
};

const savePortfolio = async (req, res) => {
  try {
    const { assets, totalValue, totalProfitLoss, riskScore, diversification } = req.body;

    const portfolio = await buildPortfolio(req.user._id);

    if (Array.isArray(assets)) portfolio.assets = assets;
    if (totalValue !== undefined) portfolio.totalValue = Number(totalValue || 0);
    if (totalProfitLoss !== undefined) portfolio.totalProfitLoss = Number(totalProfitLoss || 0);
    if (riskScore !== undefined) portfolio.riskScore = Number(riskScore || 0);
    if (diversification !== undefined) portfolio.diversification = Number(diversification || 0);

    portfolio.history.push({
      totalValue: portfolio.totalValue,
      riskScore: portfolio.riskScore,
      totalProfitLoss: portfolio.totalProfitLoss,
    });

    await portfolio.save();

    res.json({
      success: true,
      message: "Portfolio saved successfully",
      portfolio,
    });
  } catch (error) {
    console.error("Save Portfolio Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save portfolio",
    });
  }
};

const rebalancePortfolio = async (req, res) => {
  try {
    const portfolio = await buildPortfolio(req.user._id);

    portfolio.riskScore = Math.max(15, portfolio.riskScore - 8);
    portfolio.diversification = Math.min(100, portfolio.diversification + 10);

    portfolio.suggestions = [
      {
        title: "Rebalance Completed",
        message: "AI reduced portfolio risk and improved diversification score.",
        type: "success",
      },
      {
        title: "Suggested Allocation",
        message: "BTC 35%, ETH 25%, BNB 20%, EXALT 10%, Stablecoin 10%.",
        type: "info",
      },
    ];

    portfolio.history.push({
      totalValue: portfolio.totalValue,
      riskScore: portfolio.riskScore,
      totalProfitLoss: portfolio.totalProfitLoss,
    });

    await portfolio.save();

    res.json({
      success: true,
      message: "Portfolio rebalanced successfully",
      portfolio,
    });
  } catch (error) {
    console.error("Rebalance Portfolio Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rebalance portfolio",
    });
  }
};

const getPortfolioHistory = async (req, res) => {
  try {
    const portfolio = await buildPortfolio(req.user._id);

    res.json({
      success: true,
      history: portfolio.history || [],
    });
  } catch (error) {
    console.error("Portfolio History Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load portfolio history",
    });
  }
};

module.exports = {
  getMyPortfolio,
  savePortfolio,
  rebalancePortfolio,
  getPortfolioHistory,
};