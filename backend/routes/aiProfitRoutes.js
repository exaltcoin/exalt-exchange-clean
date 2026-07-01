const express = require("express");
const router = express.Router();

const {
  createCalculation,
  getMyCalculations,
  getCalculationById,
  toggleFavorite,
  deleteMyCalculation,
  getAllCalculationsAdmin,
  getProfitStatsAdmin,
  reviewCalculationAdmin,
  deleteCalculationAdmin,
} = require("../controllers/aiProfitController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* USER ROUTES */
router.post("/calculate", protect, createCalculation);
router.get("/my", protect, getMyCalculations);
router.get("/my/:id", protect, getCalculationById);
router.put("/my/:id/favorite", protect, toggleFavorite);
router.delete("/my/:id", protect, deleteMyCalculation);

/* ADMIN ROUTES */
router.get("/admin/stats", protect, adminOnly, getProfitStatsAdmin);
router.get("/admin/calculations", protect, adminOnly, getAllCalculationsAdmin);
router.put("/admin/calculations/:id/review", protect, adminOnly, reviewCalculationAdmin);
router.delete("/admin/calculations/:id", protect, adminOnly, deleteCalculationAdmin);

module.exports = router;