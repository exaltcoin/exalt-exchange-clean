const express = require("express");
const router = express.Router();

const {
  createLaunchpadProject,
  getLaunchpadProjects,
  toggleFavoriteLaunchpad,
  getAdminLaunchpadProjects,
  getLaunchpadStats,
  reviewLaunchpadProject,
  deleteLaunchpadProject,
} = require("../controllers/aiLaunchpadController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

/* USER */
router.post("/", protect, createLaunchpadProject);
router.get("/", protect, getLaunchpadProjects);

router.put(
  "/favorite/:id",
  protect,
  toggleFavoriteLaunchpad
);

/* ADMIN */

router.get(
  "/admin",
  protect,
  adminOnly,
  getAdminLaunchpadProjects
);

router.get(
  "/admin/stats",
  protect,
  adminOnly,
  getLaunchpadStats
);

router.put(
  "/admin/review/:id",
  protect,
  adminOnly,
  reviewLaunchpadProject
);

router.delete(
  "/admin/:id",
  protect,
  adminOnly,
  deleteLaunchpadProject
);

module.exports = router;