const express = require("express");
const router = express.Router();
const Web3Transaction = require("../models/Web3Transaction");

router.post("/", async (req, res) => {
  try {
    const tx = await Web3Transaction.create(req.body);

    res.status(201).json({
      success: true,
      transaction: tx,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/:wallet", async (req, res) => {
  try {
    const transactions = await Web3Transaction.find({
      wallet: req.params.wallet.toLowerCase(),
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;