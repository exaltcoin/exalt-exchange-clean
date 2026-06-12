const express = require("express");
const router = express.Router();

const {
  getCoins,
  addCoin,
  getWeb3Coins,
  getMarketCoins,
} = require("../controllers/coinController");

router.get("/", getCoins);
router.get("/web3", getWeb3Coins);
router.get("/market", getMarketCoins);

router.post("/add", addCoin);

module.exports = router;