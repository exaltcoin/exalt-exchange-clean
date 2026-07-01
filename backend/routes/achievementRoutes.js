const express = require("express");
const router = express.Router();

const {
  getMyAchievements,
  refreshAchievements,
  getAllAchievements,
  getSingleAchievement,
  updateAchievementStats,
} = require("../controllers/achievementController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* ===========================
   USER ROUTES
=========================== */

router.get("/me", protect, getMyAchievements);

router.post("/refresh", protect, refreshAchievements);

/* ===========================
   ADMIN ROUTES
=========================== */

router.get("/admin/all", protect, adminOnly, getAllAchievements);

router.get("/admin/:id", protect, adminOnly, getSingleAchievement);

router.put("/admin/:id", protect, adminOnly, updateAchievementStats);

module.exports = router;