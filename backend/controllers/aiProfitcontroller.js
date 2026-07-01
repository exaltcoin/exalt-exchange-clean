const AIProfitCalculation = require("../models/AIProfitCalculation");

const clamp = (value, min = 0, max = 100) => {
  return Math.min(Math.max(Number(value || 0), min), max);
};

const round = (num) => {
  return Number(Number(num || 0).toFixed(4));
};

const calculateRiskLevel = (leverage, roi, riskRewardRatio) => {
  if (leverage >= 20 || riskRewardRatio < 1 || roi < -10) return "High";
  if (leverage >= 5 || riskRewardRatio < 1.5) return "Medium";
  return "Low";
};

const generateRecommendation = ({ riskLevel, positionType, roi, leverage }) => {
  if (riskLevel === "High") {
    return "High risk setup detected. Reduce leverage, improve stop loss, and avoid overexposure.";
  }

  if (riskLevel === "Medium") {
    return "Medium risk setup. Use smaller position size and confirm trend before entry.";
  }

  if (positionType === "Short" && roi > 0) {
    return "Short setup looks profitable. Keep stop loss active and monitor volatility.";
  }

  if (leverage <= 3) {
    return "Low risk setup. Maintain proper stop loss and avoid emotional entries.";
  }

  return "Profit setup looks balanced. Follow your trading plan and manage risk.";
};

const calculateProfit = (body) => {
  const capital = Number(body.capital || 0);
  const entryPrice = Number(body.entryPrice || 0);
  const exitPrice = Number(body.exitPrice || 0);
  const stopLossPrice = Number(body.stopLossPrice || 0);
  const takeProfitPrice = Number(body.takeProfitPrice || 0);
  const leverage = Number(body.leverage || 1);
  const positionType = body.positionType || "Long";
  const compoundEnabled = Boolean(body.compoundEnabled);
  const compoundDays = Number(body.compoundDays || 30);

  let priceMovePercent = 0;

  if (entryPrice > 0 && exitPrice > 0) {
    if (positionType === "Short") {
      priceMovePercent = ((entryPrice - exitPrice) / entryPrice) * 100;
    } else {
      priceMovePercent = ((exitPrice - entryPrice) / entryPrice) * 100;
    }
  }

  const roi = round(priceMovePercent * leverage);
  const expectedProfit = round((capital * roi) / 100);
  const netProfit = expectedProfit;

  let expectedLoss = 0;

  if (entryPrice > 0 && stopLossPrice > 0) {
    let lossPercent = 0;

    if (positionType === "Short") {
      lossPercent = ((stopLossPrice - entryPrice) / entryPrice) * 100;
    } else {
      lossPercent = ((entryPrice - stopLossPrice) / entryPrice) * 100;
    }

    expectedLoss = round(Math.abs((capital * lossPercent * leverage) / 100));
  }

  let targetProfit = expectedProfit;

  if (entryPrice > 0 && takeProfitPrice > 0) {
    let tpPercent = 0;

    if (positionType === "Short") {
      tpPercent = ((entryPrice - takeProfitPrice) / entryPrice) * 100;
    } else {
      tpPercent = ((takeProfitPrice - entryPrice) / entryPrice) * 100;
    }

    targetProfit = round((capital * tpPercent * leverage) / 100);
  }

  const riskRewardRatio =
    expectedLoss > 0 ? round(Math.abs(targetProfit / expectedLoss)) : 0;

  const winRate = clamp(
    60 + (riskRewardRatio >= 2 ? 12 : 0) - (leverage > 10 ? 15 : 0),
    35,
    92
  );

  const dailyProfit = round(expectedProfit);
  const weeklyProfit = round(expectedProfit * 7);
  const monthlyProfit = round(expectedProfit * 30);
  const yearlyProfit = round(expectedProfit * 365);

  const compoundResult = compoundEnabled
    ? round(capital * Math.pow(1 + roi / 100, compoundDays))
    : 0;

  const riskLevel = calculateRiskLevel(leverage, roi, riskRewardRatio);

  const aiConfidence = clamp(
    88 + (riskRewardRatio >= 2 ? 5 : 0) - (leverage > 10 ? 15 : 0),
    50,
    97
  );

  const recommendation = generateRecommendation({
    riskLevel,
    positionType,
    roi,
    leverage,
  });

  return {
    expectedProfit,
    expectedLoss,
    netProfit,
    roi,
    riskRewardRatio,
    winRate,
    dailyProfit,
    weeklyProfit,
    monthlyProfit,
    yearlyProfit,
    compoundResult,
    aiConfidence,
    riskLevel,
    recommendation,
  };
};

/* USER: CREATE CALCULATION */
exports.createCalculation = async (req, res) => {
  try {
    const result = calculateProfit(req.body);

    const calculation = await AIProfitCalculation.create({
      user: req.user._id,
      ...req.body,
      ...result,
      history: [
        {
          symbol: req.body.symbol || "BTC/USDT",
          marketType: req.body.marketType || "Spot",
          capital: req.body.capital,
          entryPrice: req.body.entryPrice,
          exitPrice: req.body.exitPrice,
          leverage: req.body.leverage || 1,
          positionType: req.body.positionType || "Long",
          ...result,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "AI profit calculation created",
      calculation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create AI profit calculation",
      error: error.message,
    });
  }
};

/* USER: GET MY CALCULATIONS */
exports.getMyCalculations = async (req, res) => {
  try {
    const calculations = await AIProfitCalculation.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      calculations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get calculations",
      error: error.message,
    });
  }
};

/* USER: GET ONE CALCULATION */
exports.getCalculationById = async (req, res) => {
  try {
    const calculation = await AIProfitCalculation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!calculation) {
      return res.status(404).json({ message: "Calculation not found" });
    }

    res.json({
      success: true,
      calculation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get calculation",
      error: error.message,
    });
  }
};

/* USER: TOGGLE FAVORITE */
exports.toggleFavorite = async (req, res) => {
  try {
    const calculation = await AIProfitCalculation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!calculation) {
      return res.status(404).json({ message: "Calculation not found" });
    }

    calculation.isFavorite = !calculation.isFavorite;
    await calculation.save();

    res.json({
      success: true,
      calculation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update favorite",
      error: error.message,
    });
  }
};

/* USER: DELETE MY CALCULATION */
exports.deleteMyCalculation = async (req, res) => {
  try {
    const calculation = await AIProfitCalculation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!calculation) {
      return res.status(404).json({ message: "Calculation not found" });
    }

    await calculation.deleteOne();

    res.json({
      success: true,
      message: "Calculation deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete calculation",
      error: error.message,
    });
  }
};

/* ADMIN: GET ALL CALCULATIONS */
exports.getAllCalculationsAdmin = async (req, res) => {
  try {
    const calculations = await AIProfitCalculation.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      calculations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get admin calculations",
      error: error.message,
    });
  }
};

/* ADMIN: STATS */
exports.getProfitStatsAdmin = async (req, res) => {
  try {
    const calculations = await AIProfitCalculation.find();

    const total = calculations.length;
    const totalCapital = round(
      calculations.reduce((sum, item) => sum + Number(item.capital || 0), 0)
    );
    const totalExpectedProfit = round(
      calculations.reduce((sum, item) => sum + Number(item.expectedProfit || 0), 0)
    );
    const totalExpectedLoss = round(
      calculations.reduce((sum, item) => sum + Number(item.expectedLoss || 0), 0)
    );
    const highRisk = calculations.filter((item) => item.riskLevel === "High").length;
    const mediumRisk = calculations.filter((item) => item.riskLevel === "Medium").length;
    const lowRisk = calculations.filter((item) => item.riskLevel === "Low").length;
    const reviewed = calculations.filter((item) => item.adminReviewed).length;

    res.json({
      success: true,
      stats: {
        total,
        totalCapital,
        totalExpectedProfit,
        totalExpectedLoss,
        highRisk,
        mediumRisk,
        lowRisk,
        reviewed,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get profit stats",
      error: error.message,
    });
  }
};

/* ADMIN: REVIEW CALCULATION */
exports.reviewCalculationAdmin = async (req, res) => {
  try {
    const { adminNote, status } = req.body;

    const calculation = await AIProfitCalculation.findByIdAndUpdate(
      req.params.id,
      {
        adminReviewed: true,
        adminNote: adminNote || "",
        status: status || "Reviewed",
      },
      { new: true }
    ).populate("user", "name email role");

    if (!calculation) {
      return res.status(404).json({ message: "Calculation not found" });
    }

    res.json({
      success: true,
      message: "Calculation reviewed",
      calculation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to review calculation",
      error: error.message,
    });
  }
};

/* ADMIN: DELETE ANY CALCULATION */
exports.deleteCalculationAdmin = async (req, res) => {
  try {
    const calculation = await AIProfitCalculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({ message: "Calculation not found" });
    }

    await calculation.deleteOne();

    res.json({
      success: true,
      message: "Calculation deleted by admin",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete admin calculation",
      error: error.message,
    });
  }
};