const express = require("express");
const router = express.Router();

router.get("/latest-receive", async (req, res) => {
  try {
    const { wallet, coin } = req.query;

    if (!wallet || !coin) {
      return res.status(400).json({
        success: false,
        message: "Wallet and coin are required",
      });
    }

    const apiKey = process.env.MORALIS_API_KEY;

    const tokenContracts = {
      EXALT: "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78",
      USDT: "0x55d398326f99059fF775485246999027B3197955",
    };

    if (coin === "BNB") {
      return res.json({
        success: false,
        message: "BNB receive history not enabled yet",
      });
    }

    const tokenAddress = tokenContracts[coin];
    if (!tokenAddress) {
      return res.json({
        success: false,
        message: "Token not supported",
      });
    }

    const url = `https://deep-index.moralis.io/api/v2.2/${wallet}/erc20/transfers?chain=bsc&token_addresses=${tokenAddress}&limit=20`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    const data = await response.json();
    console.log("MORALIS RESPONSE:", data);

    const result = data.result || [];

    const tx = result.find(
      (item) =>
        item.to_address &&
        item.to_address.toLowerCase() === wallet.toLowerCase()
    );

    if (!tx) {
      return res.json({
        success: false,
        message: "No receive transaction found",
      });
    }

    return res.json({
      success: true,
      hash: tx.transaction_hash,
      amount: tx.value_decimal || tx.value,
      coin,
    });
  } catch (err) {
    console.log("Moralis receive tx error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;