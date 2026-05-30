const express = require("express");
const router = express.Router();

const {
  openPosition,
  getPositions,
  closePosition,
  getFuturesHistory,
} = require("../controllers/futuresController");

router.post("/open", openPosition);
router.get("/positions", getPositions);
router.put("/close/:id", closePosition);
router.get("/history", getFuturesHistory);

module.exports = router;