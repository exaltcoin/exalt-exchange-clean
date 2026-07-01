const express = require("express");
const router = express.Router();

const {
  openPosition,
  getPositions,
  closePosition,
  getFuturesHistory,
} = require("../controllers/futuresController");

const { protect } = require("../middleware/authMiddleware");

/* USER: open futures position */
router.post("/open", protect, openPosition);

/* USER: get own open positions */
router.get("/positions", protect, getPositions);

/* USER: close own position */
router.put("/close/:id", protect, closePosition);

/* USER: futures history */
router.get("/history", protect, getFuturesHistory);

module.exports = router;