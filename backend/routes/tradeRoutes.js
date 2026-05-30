const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrderBook,
  getTrades,
} = require("../controllers/tradeController");

router.post("/order", createOrder);

router.get("/orderbook/:pair", getOrderBook);

router.get("/history/:pair", getTrades);

module.exports = router;