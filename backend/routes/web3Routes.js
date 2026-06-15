const express = require("express");
const router = express.Router();

router.get("/latest-receive", async (req, res) => {
  try {
    const { wallet, coin } = req.query;

    res.json({
      success: true,
      wallet,
      coin
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;