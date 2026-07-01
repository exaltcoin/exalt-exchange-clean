const express = require("express");
const router = express.Router();

const {
  getMyRiskProfile,
  refreshMyRisk,
  getMyRiskHistory,

  getAllRiskProfiles,
  getRiskStats,
  updateUserRisk,
  deleteRiskProfile,

  toggleWatchlist,
  toggleRestricted,
  toggleFreezeWithdrawals,
  toggleFreezeP2P,
  toggleRequireKYC,
} = require("../controllers/riskController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* ================= USER ================= */

router.get("/me", protect, getMyRiskProfile);

router.post("/refresh", protect, refreshMyRisk);

router.get("/history", protect, getMyRiskHistory);


/* ================= ADMIN ================= */

router.get(
  "/admin/stats",
  protect,
  adminOnly,
  getRiskStats
);

router.get(
  "/admin/profiles",
  protect,
  adminOnly,
  getAllRiskProfiles
);

router.put(
  "/admin/users/:userId",
  protect,
  adminOnly,
  updateUserRisk
);

router.delete(
  "/admin/profiles/:id",
  protect,
  adminOnly,
  deleteRiskProfile
);


/* ===== WATCHLIST ===== */

router.put(
  "/admin/watchlist/:id",
  protect,
  adminOnly,
  toggleWatchlist
);


/* ===== RESTRICTED ===== */

router.put(
  "/admin/restricted/:id",
  protect,
  adminOnly,
  toggleRestricted
);


/* ===== FREEZE WITHDRAWALS ===== */

router.put(
  "/admin/freeze-withdrawals/:id",
  protect,
  adminOnly,
  toggleFreezeWithdrawals
);


/* ===== FREEZE P2P ===== */

router.put(
  "/admin/freeze-p2p/:id",
  protect,
  adminOnly,
  toggleFreezeP2P
);


/* ===== REQUIRE KYC ===== */

router.put(
  "/admin/require-kyc/:id",
  protect,
  adminOnly,
  toggleRequireKYC
);

module.exports = router;