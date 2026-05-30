const express = require("express");
const router = express.Router();

const {
  getCoins,
  addCoin,
} = require("../controllers/coinController");

router.get("/", getCoins);
router.post("/add", addCoin);

module.exports = router;