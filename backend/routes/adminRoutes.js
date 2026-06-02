const express = require("express");
const router = express.Router();

const {
  approveDeposit,
  approveWithdrawal,
} = require("../controllers/adminController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// ADMIN ONLY: approve deposit
router.post("/approve-deposit", protect, adminOnly, approveDeposit);

// ADMIN ONLY: approve withdrawal
router.post("/approve-withdrawal", protect, adminOnly, approveWithdrawal);

module.exports = router;