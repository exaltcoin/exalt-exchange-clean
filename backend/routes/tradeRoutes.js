const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrderBook,
  getTrades,
  getMyOrders,
  getAllTrades,
} = require("../controllers/tradeController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

/* USER: place buy/sell order */
router.post("/order", protect, createOrder);

/* PUBLIC: order book by pair */
router.get("/orderbook/:pair", getOrderBook);

/* PUBLIC: trade history by pair */
router.get("/history/:pair", getTrades);

/* USER: my orders */
router.get("/my-orders", protect, getMyOrders);

/* ADMIN: all trades */
router.get("/admin", protect, adminOnly, getAllTrades);

module.exports = router;