const express = require("express");
const router = express.Router();

const {
  getCoins,
  addCoin,
  getWeb3Coins,
  getMarketCoins,
  syncDexMarketCoins,
  getAllMarketCoins
} = require("../controllers/coinController");

router.get("/", getCoins);
router.get("/web3", getWeb3Coins);
router.get("/market", getMarketCoins);
router.get("/sync-dex", syncDexMarketCoins);
router.get("/all-market", getAllMarketCoins);

router.post("/add", addCoin);

module.exports = router;