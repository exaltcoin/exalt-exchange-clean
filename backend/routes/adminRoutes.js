const express = require("express");
const router = express.Router();

const {
  approveDeposit,
  approveWithdrawal,
} = require("../controllers/adminController");

router.post("/approve-deposit", approveDeposit);

router.post("/approve-withdrawal", approveWithdrawal);

module.exports = router;