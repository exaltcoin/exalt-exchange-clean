const express = require("express");
const router = express.Router();

const {
  createMarketScan,
  getMyMarketScans,
  toggleFavoriteScan,
  deleteMyMarketScan,
  getAllMarketScansAdmin,
  getMarketScannerStatsAdmin,
  reviewMarketScanAdmin,
  deleteMarketScanAdmin,
} = require("../controllers/aiMarketScannerController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* USER ROUTES */
router.post("/scan", protect, createMarketScan);
router.get("/my", protect, getMyMarketScans);
router.put("/my/:id/favorite", protect, toggleFavoriteScan);
router.delete("/my/:id", protect, deleteMyMarketScan);

/* ADMIN ROUTES */
router.get("/admin/stats", protect, adminOnly, getMarketScannerStatsAdmin);
router.get("/admin/scans", protect, adminOnly, getAllMarketScansAdmin);
router.put("/admin/scans/:id/review", protect, adminOnly, reviewMarketScanAdmin);
router.delete("/admin/scans/:id", protect, adminOnly, deleteMarketScanAdmin);

module.exports = router;