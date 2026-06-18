const express = require("express");
const {
  getAIRecords,
  createAIRecord,
  getAISummary,
} = require("../controllers/aiController");

const router = express.Router();

// AI summary
router.get("/summary/all", getAISummary);

// Get module records
router.get("/:module", getAIRecords);

// Create AI record
router.post("/", createAIRecord);

module.exports = router;