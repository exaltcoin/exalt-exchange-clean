const RiskProfile = require("../models/RiskProfile");

const clamp = (value, min = 0, max = 100) => {
  return Math.min(Math.max(Number(value || 0), min), max);
};

const calculateRiskLevel = (score) => {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
};

const calculateStatus = (score, restricted, watchlist) => {
  if (restricted) return "Restricted";
  if (watchlist || score >= 70) return "Watchlist";
  return "Safe";
};

const calculateLeverage = (score) => {
  if (score >= 70) return "1x";
  if (score >= 40) return "2x";
  return "3x";
};

const generateRecommendations = (score, factors = {}, flags = {}) => {
  const list = [];

  if (!factors.kycCompleted) {
    list.push("Complete KYC verification to reduce account risk.");
  }

  if (factors.suspiciousActivity) {
    list.push("Review suspicious activity and secure your account immediately.");
  }

  if (factors.highWithdrawals || factors.withdrawalRisk > 20) {
    list.push("High withdrawal activity detected. Reduce withdrawal frequency.");
  }

  if (factors.p2pDisputes > 0) {
    list.push("Resolve P2P disputes to improve account trust score.");
  }

  if (factors.failedLoginAttempts > 3) {
    list.push("Multiple failed logins detected. Change password and enable security protection.");
  }

  if (factors.portfolioConcentration > 40) {
    list.push("Portfolio concentration is high. Diversify holdings to reduce exposure.");
  }

  if (flags.freezeWithdrawals) {
    list.push("Withdrawals are frozen by admin until risk review is complete.");
  }

  if (flags.freezeP2P) {
    list.push("P2P trading is frozen by admin due to risk review.");
  }

  if (flags.requireKYC) {
    list.push("KYC verification is required before full account access.");
  }

  if (score < 40) {
    list.push("Your account risk is low. Keep security settings active.");
  }

  if (score >= 40 && score < 70) {
    list.push("Medium risk detected. Improve verification and reduce unusual activity.");
  }

  if (score >= 70) {
    list.push("High risk detected. Admin review may be required.");
  }

  return [...new Set(list)];
};

const calculateProfileMetrics = (score) => {
  return {
    aiConfidence: clamp(95 - Math.floor(score / 4), 65, 98),
    accountHealth: clamp(100 - score),
    portfolioExposure: clamp(score + 12),
    capitalProtection: clamp(100 - score),
    suggestedLeverage: calculateLeverage(score),
  };
};

const calculateScoreFromFactors = (factors = {}) => {
  let score = 20;

  if (!factors.kycCompleted) score += 15;
  if (factors.suspiciousActivity) score += 30;
  if (factors.highWithdrawals) score += 20;
  if (factors.p2pDisputes > 0) score += factors.p2pDisputes * 10;
  if (factors.failedLoginAttempts > 3) score += 15;
  if (factors.accountAgeRisk > 0) score += Number(factors.accountAgeRisk);
  if (factors.tradeRisk > 0) score += Number(factors.tradeRisk);
  if (factors.withdrawalRisk > 0) score += Number(factors.withdrawalRisk);
  if (factors.portfolioConcentration > 0) {
    score += Math.floor(Number(factors.portfolioConcentration) / 3);
  }

  return clamp(score);
};

const pushHistory = (profile, score, level, status, reason, recommendations, createdBy = "AI") => {
  profile.history.unshift({
    score,
    level,
    status,
    reason,
    recommendations,
    aiConfidence: profile.aiConfidence || 90,
    createdBy,
    createdAt: new Date(),
  });

  profile.history = profile.history.slice(0, 50);
};

const pushAdminAction = (profile, action, note, adminId) => {
  profile.adminActions.unshift({
    action,
    note: note || "",
    admin: adminId,
    createdAt: new Date(),
  });

  profile.adminActions = profile.adminActions.slice(0, 100);
};

const ensureProfile = async (userId) => {
  let profile = await RiskProfile.findOne({ user: userId });

  if (!profile) {
    const score = 20;
    const level = calculateRiskLevel(score);
    const metrics = calculateProfileMetrics(score);

    profile = await RiskProfile.create({
      user: userId,
      riskScore: score,
      riskLevel: level,
      status: "Safe",
      ...metrics,
      recommendations: generateRecommendations(score, {}),
      history: [
        {
          score,
          level,
          status: "Safe",
          reason: "Risk profile created",
          recommendations: generateRecommendations(score, {}),
          aiConfidence: metrics.aiConfidence,
          createdBy: "System",
        },
      ],
    });
  }

  return profile;
};

/* USER: GET MY RISK PROFILE */
exports.getMyRiskProfile = async (req, res) => {
  try {
    let profile = await ensureProfile(req.user._id);

    profile = await RiskProfile.findById(profile._id)
      .populate("user", "name email role");

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get risk profile",
      error: error.message,
    });
  }
};

/* USER: REFRESH / CALCULATE RISK */
exports.refreshMyRisk = async (req, res) => {
  try {
    const profile = await ensureProfile(req.user._id);
    const factors = profile.factors || {};

    const score = calculateScoreFromFactors(factors);
    const level = calculateRiskLevel(score);
    const status = calculateStatus(score, profile.restricted, profile.watchlist);
    const metrics = calculateProfileMetrics(score);

    const recommendations = generateRecommendations(score, factors, {
      freezeWithdrawals: profile.freezeWithdrawals,
      freezeP2P: profile.freezeP2P,
      requireKYC: profile.requireKYC,
    });

    profile.riskScore = score;
    profile.riskLevel = level;
    profile.status = status;
    profile.aiConfidence = metrics.aiConfidence;
    profile.accountHealth = metrics.accountHealth;
    profile.portfolioExposure = metrics.portfolioExposure;
    profile.capitalProtection = metrics.capitalProtection;
    profile.suggestedLeverage = metrics.suggestedLeverage;
    profile.recommendations = recommendations;

    pushHistory(
      profile,
      score,
      level,
      status,
      "AI risk scan refreshed",
      recommendations,
      "AI"
    );

    await profile.save();

    const populated = await RiskProfile.findById(profile._id)
      .populate("user", "name email role");

    res.json({
      success: true,
      message: "Risk profile refreshed",
      profile: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to refresh risk",
      error: error.message,
    });
  }
};

/* USER: GET RISK HISTORY */
exports.getMyRiskHistory = async (req, res) => {
  try {
    const profile = await ensureProfile(req.user._id);

    res.json({
      success: true,
      history: profile.history || [],
      adminActions: profile.adminActions || [],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get risk history",
      error: error.message,
    });
  }
};

/* ADMIN: GET ALL RISK PROFILES */
exports.getAllRiskProfiles = async (req, res) => {
  try {
    const profiles = await RiskProfile.find()
      .populate("user", "name email role")
      .populate("adminActions.admin", "name email role")
      .sort({ riskScore: -1, updatedAt: -1 });

    res.json({ success: true, profiles });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get risk profiles",
      error: error.message,
    });
  }
};

/* ADMIN: GET RISK STATS */
exports.getRiskStats = async (req, res) => {
  try {
    const total = await RiskProfile.countDocuments();
    const low = await RiskProfile.countDocuments({ riskLevel: "Low" });
    const medium = await RiskProfile.countDocuments({ riskLevel: "Medium" });
    const high = await RiskProfile.countDocuments({ riskLevel: "High" });
    const watchlist = await RiskProfile.countDocuments({ watchlist: true });
    const restricted = await RiskProfile.countDocuments({ restricted: true });
    const freezeWithdrawals = await RiskProfile.countDocuments({ freezeWithdrawals: true });
    const freezeP2P = await RiskProfile.countDocuments({ freezeP2P: true });
    const requireKYC = await RiskProfile.countDocuments({ requireKYC: true });

    res.json({
      success: true,
      stats: {
        total,
        low,
        medium,
        high,
        watchlist,
        restricted,
        freezeWithdrawals,
        freezeP2P,
        requireKYC,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get risk stats",
      error: error.message,
    });
  }
};

/* ADMIN: UPDATE USER RISK */
exports.updateUserRisk = async (req, res) => {
  try {
    const {
      riskScore,
      status,
      reason,
      factors,
      adminNote,
      watchlist,
      restricted,
      freezeWithdrawals,
      freezeP2P,
      requireKYC,
    } = req.body;

    const profile = await ensureProfile(req.params.userId);

    const score = clamp(riskScore);
    const level = calculateRiskLevel(score);

    profile.watchlist = Boolean(watchlist);
    profile.restricted = Boolean(restricted);
    profile.freezeWithdrawals = Boolean(freezeWithdrawals);
    profile.freezeP2P = Boolean(freezeP2P);
    profile.requireKYC = Boolean(requireKYC);
    profile.adminNote = adminNote || profile.adminNote || "";

    profile.status = status || calculateStatus(score, profile.restricted, profile.watchlist);
    profile.factors = factors || profile.factors || {};

    const metrics = calculateProfileMetrics(score);
    const recommendations = generateRecommendations(score, profile.factors, {
      freezeWithdrawals: profile.freezeWithdrawals,
      freezeP2P: profile.freezeP2P,
      requireKYC: profile.requireKYC,
    });

    profile.riskScore = score;
    profile.riskLevel = level;
    profile.aiConfidence = metrics.aiConfidence;
    profile.accountHealth = metrics.accountHealth;
    profile.portfolioExposure = metrics.portfolioExposure;
    profile.capitalProtection = metrics.capitalProtection;
    profile.suggestedLeverage = metrics.suggestedLeverage;
    profile.recommendations = recommendations;

    pushHistory(
      profile,
      score,
      level,
      profile.status,
      reason || "Admin updated risk profile",
      recommendations,
      "Admin"
    );

    pushAdminAction(
      profile,
      "Risk Updated",
      reason || "Admin updated risk profile",
      req.user?._id
    );

    await profile.save();

    const populated = await RiskProfile.findById(profile._id)
      .populate("user", "name email role")
      .populate("adminActions.admin", "name email role");

    res.json({
      success: true,
      message: "Risk profile updated",
      profile: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update risk profile",
      error: error.message,
    });
  }
};

const toggleBooleanFlag = async (req, res, field, enabledAction, disabledAction) => {
  try {
    const profile = await RiskProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: "Risk profile not found" });
    }

    profile[field] = !profile[field];

    if (field === "watchlist") {
      profile.status = calculateStatus(profile.riskScore, profile.restricted, profile.watchlist);
    }

    if (field === "restricted") {
      profile.status = calculateStatus(profile.riskScore, profile.restricted, profile.watchlist);
    }

    pushAdminAction(
      profile,
      profile[field] ? enabledAction : disabledAction,
      req.body?.note || "",
      req.user?._id
    );

    await profile.save();

    const populated = await RiskProfile.findById(profile._id)
      .populate("user", "name email role")
      .populate("adminActions.admin", "name email role");

    res.json({
      success: true,
      message: `${field} updated`,
      profile: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: `Failed to update ${field}`,
      error: error.message,
    });
  }
};

exports.toggleWatchlist = (req, res) =>
  toggleBooleanFlag(req, res, "watchlist", "Watchlist Enabled", "Watchlist Disabled");

exports.toggleRestricted = (req, res) =>
  toggleBooleanFlag(req, res, "restricted", "Restricted Enabled", "Restricted Disabled");

exports.toggleFreezeWithdrawals = (req, res) =>
  toggleBooleanFlag(req, res, "freezeWithdrawals", "Withdrawals Frozen", "Withdrawals Unfrozen");

exports.toggleFreezeP2P = (req, res) =>
  toggleBooleanFlag(req, res, "freezeP2P", "P2P Frozen", "P2P Unfrozen");

exports.toggleRequireKYC = (req, res) =>
  toggleBooleanFlag(req, res, "requireKYC", "KYC Required", "KYC Requirement Removed");

/* ADMIN: DELETE RISK PROFILE */
exports.deleteRiskProfile = async (req, res) => {
  try {
    const profile = await RiskProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: "Risk profile not found" });
    }

    await profile.deleteOne();

    res.json({
      success: true,
      message: "Risk profile deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete risk profile",
      error: error.message,
    });
  }
};