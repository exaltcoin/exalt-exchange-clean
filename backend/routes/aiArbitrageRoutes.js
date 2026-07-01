const express = require("express");
const router = express.Router();

const {
  createArbitrage,
  getArbitrageList,
  toggleFavorite,
  getAdminArbitrage,
  getArbitrageStats,
} = require("../controllers/aiArbitrageController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* ADMIN ROUTES */
router.get("/admin/stats", protect, adminOnly, getArbitrageStats);
router.get("/admin/list", protect, adminOnly, getAdminArbitrage);

/* USER ROUTES */
router.get("/", protect, getArbitrageList);
router.post("/", protect, createArbitrage);
router.put("/:id/favorite", protect, toggleFavorite);

module.exports = router;