const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const RewardClaim = require("../models/rewardClaim");
const User = require("../models/user");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const MINING_POOL_TOTAL = Number(process.env.MINING_POOL_TOTAL || 1000000);
const REFERRAL_POOL_TOTAL = Number(process.env.REFERRAL_POOL_TOTAL || 1000000);
const MINING_DAILY_RATE = Number(process.env.MINING_DAILY_RATE || 2.4);
const MINING_COOLDOWN_HOURS = Number(process.env.MINING_COOLDOWN_HOURS || 24);

const TASK_REWARDS = {
  telegram: 100,
  x_follow: 100,
  invite_friend: 250,
};

const getClientIp = (req) =>
  String(
    req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      req.ip ||
      ""
  ).trim();

const getDeviceHash = (req) => {
  const raw = `${req.headers["user-agent"] || ""}-${req.headers["accept-language"] || ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
};

const createNotificationSafe = async ({
  userId,
  title,
  message,
  type = "Reward",
  priority = "Normal",
}) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      priority,
      isRead: false,
      isGlobal: false,
    });
  } catch (error) {
    console.log("Notification create failed:", error.message);
  }
};

const getPoolStats = async () => {
  const approvedMining = await RewardClaim.aggregate([
    { $match: { rewardType: "mining", status: "approved" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const approvedReferral = await RewardClaim.aggregate([
    { $match: { rewardType: "referral", status: "approved" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalMiningDistributed = Number(approvedMining?.[0]?.total || 0);
  const totalReferralDistributed = Number(approvedReferral?.[0]?.total || 0);

  return {
    mining: {
      total: MINING_POOL_TOTAL,
      distributed: totalMiningDistributed,
      remaining: Math.max(0, MINING_POOL_TOTAL - totalMiningDistributed),
      dailyRate: MINING_DAILY_RATE,
    },
    referral: {
      total: REFERRAL_POOL_TOTAL,
      distributed: totalReferralDistributed,
      remaining: Math.max(0, REFERRAL_POOL_TOTAL - totalReferralDistributed),
    },
  };
};

router.get("/me", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const myClaims = await RewardClaim.find({ userId }).sort({ createdAt: -1 });
    const pools = await getPoolStats();

    res.json({
      success: true,
      data: {
        pools,
        claims: myClaims,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Rewards data failed",
      error: error.message,
    });
  }
});

router.get("/dashboard", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pools = await getPoolStats();

    const myClaims = await RewardClaim.find({ userId }).sort({ createdAt: -1 });

    const myApproved = myClaims
      .filter((c) => c.status === "approved")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const myPending = myClaims
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const todayClaims = await RewardClaim.countDocuments({
      createdAt: { $gte: since24h },
    });

    const activeMiners = await RewardClaim.distinct("userId", {
      rewardType: "mining",
    });

    res.json({
      success: true,
      data: {
        pools,
        myStats: {
          totalClaims: myClaims.length,
          approvedAmount: myApproved,
          pendingAmount: myPending,
          pendingClaims: myClaims.filter((c) => c.status === "pending").length,
          approvedClaims: myClaims.filter((c) => c.status === "approved").length,
          rejectedClaims: myClaims.filter((c) => c.status === "rejected").length,
        },
        platformStats: {
          todayClaims,
          activeMiners: activeMiners.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Reward dashboard failed",
      error: error.message,
    });
  }
});

router.get("/leaderboard", protect, async (req, res) => {
  try {
    const topMiners = await RewardClaim.aggregate([
      { $match: { rewardType: "mining", status: "approved" } },
      { $group: { _id: "$userId", totalEarned: { $sum: "$amount" }, claims: { $sum: 1 } } },
      { $sort: { totalEarned: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          totalEarned: 1,
          claims: 1,
          name: "$user.name",
          email: "$user.email",
        },
      },
    ]);

    const topReferrers = await User.find({ referralCount: { $gt: 0 } })
      .select("name email referralCode referralCount approvedReferralRewards")
      .sort({ approvedReferralRewards: -1, referralCount: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        topMiners,
        topReferrers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Leaderboard failed",
      error: error.message,
    });
  }
});

router.post("/claim-mining", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";
    const deviceHash = getDeviceHash(req);

    const cooldownFrom = new Date(
      Date.now() - MINING_COOLDOWN_HOURS * 60 * 60 * 1000
    );

    const recentClaim = await RewardClaim.findOne({
      userId,
      rewardType: "mining",
      createdAt: { $gte: cooldownFrom },
    }).sort({ createdAt: -1 });

    if (recentClaim) {
      return res.status(400).json({
        success: false,
        message: `You can claim mining reward once every ${MINING_COOLDOWN_HOURS} hours.`,
      });
    }

    const pending = await RewardClaim.findOne({
      userId,
      rewardType: "mining",
      status: "pending",
    });

    if (pending) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending mining claim",
      });
    }

    const approvedMining = await RewardClaim.aggregate([
      { $match: { rewardType: "mining", status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const distributed = Number(approvedMining?.[0]?.total || 0);
    const remaining = Math.max(0, MINING_POOL_TOTAL - distributed);

    if (remaining <= 0) {
      return res.status(400).json({
        success: false,
        message: "Mining reward pool is finished",
      });
    }

    const duplicateIpCount = await RewardClaim.countDocuments({
      ipAddress,
      createdAt: { $gte: cooldownFrom },
    });

    const duplicateDeviceCount = await RewardClaim.countDocuments({
      deviceHash,
      createdAt: { $gte: cooldownFrom },
    });

    let riskScore = 0;
    const reasons = [];

    if (duplicateIpCount >= 3) {
      riskScore += 35;
      reasons.push("Multiple reward claims from same IP in 24h");
    }

    if (duplicateDeviceCount >= 2) {
      riskScore += 35;
      reasons.push("Multiple accounts/claims from same device in 24h");
    }

    if (!userAgent) {
      riskScore += 15;
      reasons.push("Missing user agent");
    }

    const riskFlag = riskScore >= 35;
    const amount = Math.min(MINING_DAILY_RATE, remaining);

    const claim = await RewardClaim.create({
      userId,
      rewardType: "mining",
      taskType: "none",
      amount,
      coin: "EXALT",
      status: "pending",
      proofText: "Mining reward claim",
      ipAddress,
      userAgent,
      deviceHash,
      claimDate: new Date(),
      lastClaimAt: new Date(),
      riskFlag,
      riskScore,
      riskReason: reasons.join(", "),
      duplicateIpCount,
      duplicateDeviceCount,
    });

    await createNotificationSafe({
      userId,
      title: riskFlag ? "Mining Claim Under Review" : "Mining Claim Submitted",
      message: riskFlag
        ? `${amount} EXALT mining claim submitted with extra security review.`
        : `${amount} EXALT mining claim submitted for admin approval.`,
      priority: riskFlag ? "High" : "Normal",
    });

    res.status(201).json({
      success: true,
      message: riskFlag
        ? "Mining claim submitted with security review"
        : "Mining claim submitted for admin approval",
      claim,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Mining claim failed",
      error: error.message,
    });
  }
});

router.post("/claim-task", protect, async (req, res) => {
  try {
    const { taskType, proofText, proofUrl } = req.body;

    if (!TASK_REWARDS[taskType]) {
      return res.status(400).json({
        success: false,
        message: "Invalid task type",
      });
    }

    const claim = await RewardClaim.create({
      userId: req.user.id,
      rewardType: "task",
      taskType,
      amount: TASK_REWARDS[taskType],
      coin: "EXALT",
      status: "pending",
      proofText: proofText || "",
      proofUrl: proofUrl || "",
      ipAddress: getClientIp(req),
      userAgent: req.headers["user-agent"] || "",
      deviceHash: getDeviceHash(req),
      claimDate: new Date(),
      lastClaimAt: new Date(),
    });

    await createNotificationSafe({
      userId: req.user.id,
      title: "Task Reward Submitted",
      message: `${TASK_REWARDS[taskType]} EXALT task reward submitted for admin approval.`,
    });

    res.status(201).json({
      success: true,
      message: "Task reward submitted for admin approval",
      claim,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Task claim failed",
      error: error.message,
    });
  }
});

router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const claims = await RewardClaim.find()
      .populate("userId", "name email wallets referralCount")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      claims,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin rewards load failed",
      error: error.message,
    });
  }
});

router.put("/admin/:claimId/status", protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reward status",
      });
    }

    const claim = await RewardClaim.findById(req.params.claimId);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Reward claim not found",
      });
    }

    const user = await User.findById(claim.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldStatus = claim.status;
    const amount = Number(claim.amount || 0);

    if (oldStatus === status) {
      return res.json({
        success: true,
        message: `Reward already ${status}`,
        claim,
        wallet: user.wallets,
      });
    }

    if (oldStatus === "approved" && status !== "approved") {
      user.wallets.EXALT = Math.max(0, Number(user.wallets.EXALT || 0) - amount);

      await Transaction.create({
        userId: user._id,
        type: "adjustment",
        amount,
        coin: "EXALT",
        status: "completed",
        note: `Reward approval reversed: ${claim.rewardType}`,
        createdBy: req.user.id,
      });
    }

    if (oldStatus !== "approved" && status === "approved") {
      user.wallets.EXALT = Number(user.wallets.EXALT || 0) + amount;

      await Transaction.create({
        userId: user._id,
        type: "reward",
        amount,
        coin: "EXALT",
        status: "completed",
        note: `${claim.rewardType} reward approved and credited to wallet`,
        createdBy: req.user.id,
      });

      claim.approvedAt = new Date();
      claim.rejectedAt = null;
      claim.adminReviewedBy = req.user.id;

      await createNotificationSafe({
        userId: user._id,
        title: "Reward Approved",
        message: `${amount} EXALT ${claim.rewardType} reward has been approved and credited to your wallet.`,
      });
    }

    if (status === "rejected") {
      claim.rejectedAt = new Date();
      claim.approvedAt = null;
      claim.adminReviewedBy = req.user.id;

      await createNotificationSafe({
        userId: user._id,
        title: "Reward Rejected",
        message: `${amount} EXALT ${claim.rewardType} reward was rejected. ${adminNote || ""}`,
      });
    }

    if (status === "pending") {
      claim.approvedAt = null;
      claim.rejectedAt = null;
      claim.adminReviewedBy = req.user.id;

      await createNotificationSafe({
        userId: user._id,
        title: "Reward Marked Pending",
        message: `${amount} EXALT ${claim.rewardType} reward has been moved back to pending review.`,
      });
    }

    claim.status = status;
    claim.adminNote = adminNote || claim.adminNote || "";

    await user.save();
    await claim.save();

    res.json({
      success: true,
      message: `Reward ${status} successfully`,
      claim,
      wallet: user.wallets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Reward status update failed",
      error: error.message,
    });
  }
});

module.exports = router;