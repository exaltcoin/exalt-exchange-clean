const express = require("express");
const router = express.Router();

const {
  getWhaleAlerts,
  createWhaleAlert,
  markWhaleAlertRead,
  toggleFavoriteWhaleAlert,
  getAdminWhaleAlerts,
  getWhaleAlertStats,
  reviewWhaleAlert,
  deleteWhaleAlert,
} = require("../controllers/aiWhaleAlertController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* ==========================
   ADMIN ROUTES
========================== */

router.get("/admin/stats", protect, adminOnly, getWhaleAlertStats);

router.get("/admin/list", protect, adminOnly, getAdminWhaleAlerts);

router.put("/admin/:id/review", protect, adminOnly, reviewWhaleAlert);

router.delete("/admin/:id", protect, adminOnly, deleteWhaleAlert);

/* ==========================
   USER ROUTES
========================== */

router.get("/", protect, getWhaleAlerts);

router.post("/", protect, createWhaleAlert);

router.put("/:id/read", protect, markWhaleAlertRead);

router.put("/:id/favorite", protect, toggleFavoriteWhaleAlert);

module.exports = router;