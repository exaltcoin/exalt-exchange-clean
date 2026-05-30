const express = require("express");
const router = express.Router();

const {
  getWallet,
  depositFunds,
  withdrawFunds,
} = require("../controllers/walletController");

router.get("/:userId", getWallet);

router.post("/deposit", depositFunds);

router.post("/withdraw", withdrawFunds);

module.exports = router;