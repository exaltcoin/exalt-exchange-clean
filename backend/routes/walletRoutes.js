const express = require("express");
const router = express.Router();

const {
  getWallet,
  depositFunds,
  withdrawFunds,
} = require("../controllers/walletController");

const { protect } = require("../middleware/authMiddleware");

// logged-in user wallet only
router.get("/me", protect, getWallet);

// logged-in user deposit only
router.post("/deposit", protect, depositFunds);

// logged-in user withdraw only
router.post("/withdraw", protect, withdrawFunds);

module.exports = router;