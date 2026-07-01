const express = require("express");
const router = express.Router();

const {
  getMyReputation,
  refreshMyReputation,
  getAllReputations,
  getSingleReputation,
  updateReputation,
} = require("../controllers/reputationController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* ===========================
   USER ROUTES
=========================== */

router.get("/me", protect, getMyReputation);

router.post("/refresh", protect, refreshMyReputation);

/* ===========================
   ADMIN ROUTES
=========================== */

router.get("/admin/all", protect, adminOnly, getAllReputations);

router.get("/admin/:id", protect, adminOnly, getSingleReputation);

router.put("/admin/:id", protect, adminOnly, updateReputation);

module.exports = router;