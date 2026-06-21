const AIPortfolio = require("../models/AIPortfolio");

const getAllAIPortfolios = async (req, res) => {
  try {
    const portfolios = await AIPortfolio.find().sort({ createdAt: -1 });

    const totalUsers = new Set(
      portfolios.map((p) => String(p.userId)).filter(Boolean)
    ).size;

    const totalPortfolioValue = portfolios.reduce(
      (sum, p) => sum + Number(p.totalValue || 0),
      0
    );

    const totalProfitLoss = portfolios.reduce(
      (sum, p) => sum + Number(p.totalProfitLoss || 0),
      0
    );

    const avgRiskScore =
      portfolios.length > 0
        ? Math.round(
            portfolios.reduce((sum, p) => sum + Number(p.riskScore || 0), 0) /
              portfolios.length
          )
        : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPortfolioValue,
        totalProfitLoss,
        avgRiskScore,
        totalPortfolios: portfolios.length,
      },
      portfolios,
    });
  } catch (error) {
    console.error("Admin AI Portfolio Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load admin AI portfolio data",
    });
  }
};

module.exports = {
  getAllAIPortfolios,
};