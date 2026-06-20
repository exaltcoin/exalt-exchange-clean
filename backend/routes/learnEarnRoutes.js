const express = require("express");
const {
  getLearnEarnProgress,
  completeLesson,
} = require("../controllers/learnEarnController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getLearnEarnProgress);

router.post("/complete", protect, completeLesson);

module.exports = router;