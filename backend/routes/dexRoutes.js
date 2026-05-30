const express = require("express");
const router = express.Router();

const {
  getTokenData,
  searchCoins,
} = require("../services/dexScreenerService");

router.get("/token/:contract", async (req, res) => {
  const data = await getTokenData(req.params.contract);

  res.json({
    success: true,
    data,
  });
});

router.get("/search/:query", async (req, res) => {
  const data = await searchCoins(req.params.query);

  res.json({
    success: true,
    data,
  });
});

module.exports = router;