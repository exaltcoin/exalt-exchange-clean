const express = require("express");
const router = express.Router();

router.get("/latest-receive", async (req, res) => {
  try {
    const { wallet, coin } = req.query;

    if (!wallet || !coin) {
      return res.status(400).json({
        success: false,
        message: "Wallet and coin are required"
      });
    }

    const apiKey = process.env.BSCSCAN_API_KEY;

    const tokenContracts = {
      EXALT: "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78",
      USDT: "0x55d398326f99059fF775485246999027B3197955"
    };

    const address = wallet.toLowerCase();
    let url = "";

    if (coin === "BNB") {
    url = `https://api.etherscan.io/v2/api?chainid=56&module=account&action=txlist&address=${wallet}&page=1&offset=10&sort=desc&apikey=${apiKey}`;
    } else {
      url = `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokentx&contractaddress=${tokenContracts[coin]}&address=${wallet}&page=1&offset=10&sort=desc&apikey=${apiKey}`;
    }

    const response = await fetch(url);
    const data = await response.json();
console.log("API RESPONSE:", data);
    if (!data.result || !Array.isArray(data.result)) {
      return res.json({ success: false, message: "No transactions found" });
    }

    const transactions = data.result.filter(
  (item) =>
    item.to &&
    item.to.toLowerCase() === address &&
    item.isError !== "1"
);

const tx = transactions[0];

    if (!tx) {
      return res.json({ success: false, message: "No receive transaction found" });
    }

    res.json({
      success: true,
      hash: tx.hash,
    amount:
  Number(tx.value) /
  Math.pow(10, Number(tx.tokenDecimal || 18)),
tokenDecimal: tx.tokenDecimal || "18" 
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;