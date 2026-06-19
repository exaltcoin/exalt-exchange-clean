const express = require("express");
const {
  getAllStakes,
  getStakingSummary,
  cancelStakeByAdmin,
} = require("../controllers/adminStakingController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getAllStakes);

router.get("/summary", protect, adminOnly, getStakingSummary);

router.post("/:id/cancel", protect, adminOnly, cancelStakeByAdmin);

module.exports = router;