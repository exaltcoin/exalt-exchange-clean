const express = require("express");
const router = express.Router();

const {
  getAllStakes,
  getStakingSummary,
  cancelStakeByAdmin,
} = require("../controllers/adminStakingController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/*
=========================================
ADMIN STAKING
=========================================
*/

router.get("/", protect, adminOnly, getAllStakes);

router.get("/summary", protect, adminOnly, getStakingSummary);

router.post("/:id/cancel", protect, adminOnly, cancelStakeByAdmin);

module.exports = router;