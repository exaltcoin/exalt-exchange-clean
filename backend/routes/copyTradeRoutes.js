const express = require("express");
const {
  getTopTraders,
  startCopyTrade,
  getMyCopyTrades,
  getAllCopyTrades,
  stopCopyTrade,
} = require("../controllers/copyTradeController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/top-traders", protect, getTopTraders);
router.post("/start", protect, startCopyTrade);
router.get("/my", protect, getMyCopyTrades);
router.put("/stop/:id", protect, stopCopyTrade);

router.get("/all", protect, adminOnly, getAllCopyTrades);

module.exports = router;