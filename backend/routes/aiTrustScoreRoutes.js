const express = require("express");
const router = express.Router();

const {
  getTrustScores,
  getSingleTrustScore,
  createOrUpdateTrustScore,
  reviewTrustScore,
  deleteTrustScore,
} = require("../controllers/aiTrustScoreController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* ADMIN ROUTES */
router.post("/admin/update", protect, adminOnly, createOrUpdateTrustScore);
router.put("/admin/:id/review", protect, adminOnly, reviewTrustScore);
router.delete("/admin/:id", protect, adminOnly, deleteTrustScore);

/* USER ROUTES */
router.get("/", protect, getTrustScores);
router.get("/:id", protect, getSingleTrustScore);

module.exports = router;