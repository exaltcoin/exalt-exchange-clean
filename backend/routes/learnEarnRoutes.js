const express = require("express");
const router = express.Router();

const {
  getLearnEarnProgress,
  completeLesson,
} = require("../controllers/learnEarnController");

const { protect } = require("../middleware/authMiddleware");

/*
=========================================
USER ROUTES
=========================================
*/

// Get user's Learn & Earn progress
router.get("/", protect, getLearnEarnProgress);

// Complete a lesson and claim reward
router.post("/complete", protect, completeLesson);

module.exports = router;