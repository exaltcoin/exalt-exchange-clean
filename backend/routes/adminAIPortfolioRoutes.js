const express = require("express");
const { getAllAIPortfolios } = require("../controllers/adminAIPortfolioController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAllAIPortfolios);

module.exports = router;