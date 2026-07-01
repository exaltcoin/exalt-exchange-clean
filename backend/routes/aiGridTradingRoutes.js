const express = require("express");
const router = express.Router();

const {
  createGrid,
  getGridList,
  toggleFavorite,
  getAdminGridList,
  getGridStats,
} = require("../controllers/aiGridTradingController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* ===========================
   ADMIN ROUTES
=========================== */

router.get("/admin/stats", protect, adminOnly, getGridStats);

router.get("/admin/list", protect, adminOnly, getAdminGridList);

/* ===========================
   USER ROUTES
=========================== */

router.get("/", protect, getGridList);

router.post("/", protect, createGrid);

router.put("/:id/favorite", protect, toggleFavorite);

module.exports = router;