const express = require("express");
const {
  stakeCoins,
  getUserStakes,
  getSingleStake,
  claimRewards,
  unstakeCoins,
} = require("../controllers/stakingController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/stake", protect, stakeCoins);
router.get("/my-stakes", protect, getUserStakes);
router.get("/:id", protect, getSingleStake);
router.post("/claim", protect, claimRewards);
router.post("/unstake", protect, unstakeCoins);

module.exports = router;