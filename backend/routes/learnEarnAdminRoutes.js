const express = require("express");
const LearnEarn = require("../models/LearnEarn");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const records = await LearnEarn.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const totalUsers = new Set(
      records.map((item) => String(item.user?._id || item.user || item.userId))
    ).size;

    const totalCompleted = records.length;

    const totalRewards = records.reduce(
      (sum, item) => sum + Number(item.reward || 0),
      0
    );

    const topLearnersMap = {};

    records.forEach((item) => {
      const userId = String(item.user?._id || item.user || item.userId || "unknown");

      if (!topLearnersMap[userId]) {
        topLearnersMap[userId] = {
          user: item.user || null,
          completed: 0,
          rewards: 0,
          xp: 0,
        };
      }

      topLearnersMap[userId].completed += 1;
      topLearnersMap[userId].rewards += Number(item.reward || 0);
      topLearnersMap[userId].xp += 100;
    });

    const topLearners = Object.values(topLearnersMap)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCompleted,
        totalRewards,
        totalCertificates: totalCompleted,
      },
      topLearners,
      records,
    });
  } catch (error) {
    console.error("Admin Learn Earn Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load Learn & Earn admin data",
    });
  }
});

module.exports = router;