const express = require("express");
const {
  getMyPortfolio,
  savePortfolio,
  rebalancePortfolio,
  getPortfolioHistory,
} = require("../controllers/aiPortfolioController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/my", protect, getMyPortfolio);
router.post("/save", protect, savePortfolio);
router.put("/rebalance", protect, rebalancePortfolio);
router.get("/history", protect, getPortfolioHistory);

module.exports = router;