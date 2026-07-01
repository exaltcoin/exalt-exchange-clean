const express = require("express");
const router = express.Router();

const {
  getWhaleHeatmap,
  syncWhaleHeatmapSymbol,
  toggleFavoriteHeatmap,
  getAdminWhaleHeatmap,
  getWhaleHeatmapStats,
  reviewWhaleHeatmap,
  deleteWhaleHeatmap,
} = require("../controllers/aiWhaleHeatmapController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* USER ROUTES */
router.get("/", protect, getWhaleHeatmap);
router.get("/sync/:symbol", protect, syncWhaleHeatmapSymbol);
router.put("/:id/favorite", protect, toggleFavoriteHeatmap);

/* ADMIN ROUTES */
router.get("/admin/list", protect, adminOnly, getAdminWhaleHeatmap);
router.get("/admin/stats", protect, adminOnly, getWhaleHeatmapStats);
router.put("/admin/:id/review", protect, adminOnly, reviewWhaleHeatmap);
router.delete("/admin/:id", protect, adminOnly, deleteWhaleHeatmap);

module.exports = router;