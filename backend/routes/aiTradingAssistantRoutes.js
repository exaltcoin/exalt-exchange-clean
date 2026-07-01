const express = require("express");
const router = express.Router();

const {
  getAssistantOverview,
  analyzeTrade,
  getTradingSignals,
  getAssistantHistory,
  saveAssistantNote,
} = require("../controllers/aiTradingAssistantController");

const { protect } = require("../middleware/authMiddleware");

/* USER: AI Trading Assistant overview */
router.get("/overview", protect, getAssistantOverview);

/* USER: analyze one trade setup */
router.post("/analyze", protect, analyzeTrade);

/* USER: get AI signals */
router.get("/signals", protect, getTradingSignals);

/* USER: assistant history */
router.get("/history", protect, getAssistantHistory);

/* USER: save note */
router.post("/note", protect, saveAssistantNote);

module.exports = router;