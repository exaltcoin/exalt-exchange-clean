const express = require("express");
const router = express.Router();

const {
  createWhaleTransaction,
  getWhaleTransactions,
  toggleFavoriteWhale,
  deleteWhaleTransaction,
  getAllWhaleTransactionsAdmin,
  getWhaleStatsAdmin,
  reviewWhaleTransactionAdmin,
  deleteWhaleTransactionAdmin,
} = require("../controllers/aiWhaleTrackerController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* ADMIN ROUTES */
router.get("/admin/stats", protect, adminOnly, getWhaleStatsAdmin);
router.get("/admin/transactions", protect, adminOnly, getAllWhaleTransactionsAdmin);
router.put("/admin/transactions/:id/review", protect, adminOnly, reviewWhaleTransactionAdmin);
router.delete("/admin/transactions/:id", protect, adminOnly, deleteWhaleTransactionAdmin);

/* USER ROUTES */
router.get("/", protect, getWhaleTransactions);
router.post("/detect", protect, createWhaleTransaction);
router.put("/:id/favorite", protect, toggleFavoriteWhale);
router.delete("/:id", protect, deleteWhaleTransaction);

module.exports = router;