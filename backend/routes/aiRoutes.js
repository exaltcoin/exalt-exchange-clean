const express = require("express");
const {
  getAIRecords,
  createAIRecord,
  getAISummary,
  getTradingAssistant,
} = require("../controllers/aiController");
const router = express.Router();

// AI summary
router.get("/summary/all", getAISummary);
router.get("/ai_trading_assistant", getTradingAssistant);
// Get module records
router.get("/:module", getAIRecords);

// Create AI record
router.post("/", createAIRecord);

module.exports = router;