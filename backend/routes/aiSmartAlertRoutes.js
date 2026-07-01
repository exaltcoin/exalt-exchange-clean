const express = require("express");
const router = express.Router();

const {
  createSmartAlert,
  getSmartAlerts,
  markAlertRead,
  toggleFavoriteAlert,
  getAdminSmartAlerts,
  getSmartAlertStats,
  reviewSmartAlert,
  deleteSmartAlert,
} = require("../controllers/aiSmartAlertController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* ADMIN ROUTES */
router.get("/admin/stats", protect, adminOnly, getSmartAlertStats);
router.get("/admin/list", protect, adminOnly, getAdminSmartAlerts);
router.put("/admin/:id/review", protect, adminOnly, reviewSmartAlert);
router.delete("/admin/:id", protect, adminOnly, deleteSmartAlert);

/* USER ROUTES */
router.get("/", protect, getSmartAlerts);
router.post("/", protect, createSmartAlert);
router.put("/:id/read", protect, markAlertRead);
router.put("/:id/favorite", protect, toggleFavoriteAlert);

module.exports = router;