const AITrustScore = require("../models/AITrustScore");
const { calculateTrustScore } = require("../services/trustScoreService");

/* USER: LIST TRUST SCORES */
exports.getTrustScores = async (req, res) => {
  try {
    const trustScores = await AITrustScore.find({
      status: { $ne: "Deleted" },
    })
      .populate("reviewedBy", "name email")
      .sort({
        trustScore: -1,
        updatedAt: -1,
      })
      .limit(200);

    res.json({
      success: true,
      trustScores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load trust scores",
      error: error.message,
    });
  }
};

/* USER: SINGLE TRUST SCORE */
exports.getSingleTrustScore = async (req, res) => {
  try {
    const trustScore = await AITrustScore.findOne({
      _id: req.params.id,
      status: { $ne: "Deleted" },
    }).populate("reviewedBy", "name email");

    if (!trustScore) {
      return res.status(404).json({
        success: false,
        message: "Trust score not found",
      });
    }

    res.json({
      success: true,
      trustScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load trust score",
      error: error.message,
    });
  }
};

/* ADMIN: CREATE OR UPDATE */
exports.createOrUpdateTrustScore = async (req, res) => {
  try {
    const {
      symbol,
      tokenAddress,
      chain,
      price,
      liquidityUSD,
      marketCapUSD,
      holders,
      whaleRiskScore,
      contractSafetyScore,
      communityScore,
      adminNote,
    } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "Symbol is required",
      });
    }

    const cleanSymbol = String(symbol).toUpperCase().trim();

    const result = calculateTrustScore({
      liquidityUSD,
      marketCapUSD,
      holders,
      whaleRiskScore,
      contractSafetyScore,
      communityScore,
    });

    const trustScore = await AITrustScore.findOneAndUpdate(
      { symbol: cleanSymbol },
      {
        symbol: cleanSymbol,
        tokenAddress: tokenAddress || "",
        chain: chain || "BNB Chain",
        price: Number(price || 0),
        liquidityUSD: Number(liquidityUSD || 0),
        marketCapUSD: Number(marketCapUSD || 0),
        holders: Number(holders || 0),
        whaleRiskScore: Number(whaleRiskScore || 0),
        contractSafetyScore: Number(contractSafetyScore || 0),
        communityScore: Number(communityScore || 0),
        ...result,
        status: "Active",
        adminReviewed: false,
        reviewedBy: req.user._id,
        adminNote: adminNote || "",
        lastSyncedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate("reviewedBy", "name email");

    res.json({
      success: true,
      message: "AI Trust Score updated",
      trustScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update trust score",
      error: error.message,
    });
  }
};

/* ADMIN: REVIEW */
exports.reviewTrustScore = async (req, res) => {
  try {
    const trustScore = await AITrustScore.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status || "Reviewed",
        adminReviewed: true,
        reviewedBy: req.user._id,
        adminNote: req.body.adminNote || "",
        reviewedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("reviewedBy", "name email");

    if (!trustScore) {
      return res.status(404).json({
        success: false,
        message: "Trust score not found",
      });
    }

    res.json({
      success: true,
      message: "Trust score reviewed",
      trustScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to review trust score",
      error: error.message,
    });
  }
};

/* ADMIN: SOFT DELETE */
exports.deleteTrustScore = async (req, res) => {
  try {
    const trustScore = await AITrustScore.findById(req.params.id);

    if (!trustScore) {
      return res.status(404).json({
        success: false,
        message: "Trust score not found",
      });
    }

    trustScore.status = "Deleted";
    trustScore.adminReviewed = true;
    trustScore.reviewedBy = req.user._id;
    trustScore.reviewedAt = new Date();
    trustScore.adminNote = "Trust score soft deleted by admin";

    await trustScore.save();

    res.json({
      success: true,
      message: "Trust score deleted",
      trustScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete trust score",
      error: error.message,
    });
  }
};