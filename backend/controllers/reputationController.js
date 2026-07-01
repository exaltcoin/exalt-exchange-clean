const Reputation = require("../models/Reputation");

/* SCORE LEVEL HELPER */
const getLevel = (score) => {
  if (score >= 80) return "Elite";
  if (score >= 60) return "Trusted";
  if (score < 30) return "High Risk";
  return "New";
};

const clamp = (value, min = 0, max = 100) => {
  return Math.min(Math.max(Number(value || 0), min), max);
};

const getBadges = (profile) => {
  const badges = [];

  if (profile.isVerifiedInvestor) badges.push("Verified Investor");
  if (profile.isTrustedTrader) badges.push("Trusted Trader");
  if (profile.isScamReporter) badges.push("Scam Reporter");
  if (profile.reputationScore >= 80) badges.push("Elite Member");
  if (profile.successfulP2POrders >= 20) badges.push("P2P Pro");
  if (profile.completedTrades >= 50) badges.push("Active Trader");

  return [...new Set(badges)];
};

const createDefaultReputation = async (userId) => {
  return Reputation.create({
    user: userId,
    reputationScore: 50,
    level: "New",
    history: [
      {
        score: 50,
        action: "Profile Created",
        reason: "Default reputation profile created",
        createdBy: "System",
      },
    ],
  });
};

/* USER: MY REPUTATION */
exports.getMyReputation = async (req, res) => {
  try {
    let reputation = await Reputation.findOne({ user: req.user._id }).populate(
      "user",
      "name email"
    );

    if (!reputation) {
      reputation = await createDefaultReputation(req.user._id);
      reputation = await Reputation.findById(reputation._id).populate(
        "user",
        "name email"
      );
    }

    res.json({
      success: true,
      reputation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load reputation",
      error: error.message,
    });
  }
};

/* USER: REFRESH SCORE */
exports.refreshMyReputation = async (req, res) => {
  try {
    let reputation = await Reputation.findOne({ user: req.user._id });

    if (!reputation) {
      reputation = await createDefaultReputation(req.user._id);
    }

    let score = 50;

    score += Math.min(Number(reputation.completedTrades || 0) * 0.4, 15);
    score += Math.min(Number(reputation.successfulP2POrders || 0) * 0.6, 15);
    score += Math.min(Number(reputation.tradingSuccessRate || 0) * 0.15, 15);
    score += Math.min(Number(reputation.p2pRating || 0) * 4, 20);

    score -= Math.min(Number(reputation.disputes || 0) * 8, 30);
    score -= Math.min((reputation.fraudFlags || []).length * 10, 40);

    if (reputation.isVerifiedInvestor) score += 8;
    if (reputation.isTrustedTrader) score += 10;
    if (reputation.isScamReporter) score += 5;

    score = clamp(Number(score.toFixed(2)));

    reputation.reputationScore = score;
    reputation.level = getLevel(score);
    reputation.badges = getBadges(reputation);
    reputation.lastCalculatedAt = new Date();

    reputation.history.unshift({
      score,
      action: "Score Refreshed",
      reason:
        "Reputation recalculated from trading, P2P, badges and risk activity",
      createdBy: "System",
    });

    reputation.history = reputation.history.slice(0, 100);

    await reputation.save();

    res.json({
      success: true,
      message: "Reputation refreshed",
      reputation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to refresh reputation",
      error: error.message,
    });
  }
};

/* ADMIN: ALL REPUTATIONS */
exports.getAllReputations = async (req, res) => {
  try {
    const reputations = await Reputation.find()
      .populate("user", "name email role")
      .sort({ reputationScore: -1, updatedAt: -1 })
      .limit(300);

    res.json({
      success: true,
      reputations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load reputations",
      error: error.message,
    });
  }
};

/* ADMIN: SINGLE REPUTATION */
exports.getSingleReputation = async (req, res) => {
  try {
    const reputation = await Reputation.findById(req.params.id).populate(
      "user",
      "name email role"
    );

    if (!reputation) {
      return res.status(404).json({
        success: false,
        message: "Reputation profile not found",
      });
    }

    res.json({
      success: true,
      reputation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load reputation profile",
      error: error.message,
    });
  }
};

/* ADMIN: UPDATE REPUTATION */
exports.updateReputation = async (req, res) => {
  try {
    const {
      reputationScore,
      p2pRating,
      tradingSuccessRate,
      completedTrades,
      successfulP2POrders,
      disputes,
      fraudFlags,
      isVerifiedInvestor,
      isTrustedTrader,
      isScamReporter,
      adminNote,
      reason,
    } = req.body;

    const reputation = await Reputation.findById(req.params.id);

    if (!reputation) {
      return res.status(404).json({
        success: false,
        message: "Reputation profile not found",
      });
    }

    if (reputationScore !== undefined) {
      reputation.reputationScore = clamp(reputationScore);
      reputation.level = getLevel(reputation.reputationScore);
    }

    if (p2pRating !== undefined) reputation.p2pRating = clamp(p2pRating, 0, 5);
    if (tradingSuccessRate !== undefined)
      reputation.tradingSuccessRate = clamp(tradingSuccessRate);
    if (completedTrades !== undefined)
      reputation.completedTrades = Math.max(0, Number(completedTrades || 0));
    if (successfulP2POrders !== undefined)
      reputation.successfulP2POrders = Math.max(
        0,
        Number(successfulP2POrders || 0)
      );
    if (disputes !== undefined)
      reputation.disputes = Math.max(0, Number(disputes || 0));
    if (Array.isArray(fraudFlags)) reputation.fraudFlags = fraudFlags;

    if (isVerifiedInvestor !== undefined)
      reputation.isVerifiedInvestor = Boolean(isVerifiedInvestor);
    if (isTrustedTrader !== undefined)
      reputation.isTrustedTrader = Boolean(isTrustedTrader);
    if (isScamReporter !== undefined)
      reputation.isScamReporter = Boolean(isScamReporter);

    if (adminNote !== undefined) reputation.adminNote = adminNote;

    reputation.badges = getBadges(reputation);
    reputation.lastCalculatedAt = new Date();

    reputation.history.unshift({
      score: reputation.reputationScore,
      action: "Admin Update",
      reason: reason || "Manual reputation update by admin",
      createdBy: "Admin",
    });

    reputation.history = reputation.history.slice(0, 100);

    await reputation.save();

    const populated = await Reputation.findById(reputation._id).populate(
      "user",
      "name email role"
    );

    res.json({
      success: true,
      message: "Reputation updated",
      reputation: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update reputation",
      error: error.message,
    });
  }
};