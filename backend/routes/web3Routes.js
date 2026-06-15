const express = require("express");
const router = express.Router();

const CHAIN = "bsc";

const TOKENS = {
  EXALT: "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78",
  USDT: "0x55d398326f99059fF775485246999027B3197955",
};

router.get("/latest-receive", async (req, res) => {
  try {
    const { wallet, coin } = req.query;

    if (!wallet || !coin) {
      return res.status(400).json({ success: false, message: "Wallet and coin are required" });
    }

    const apiKey = process.env.MORALIS_API_KEY;
    const address = wallet.toLowerCase();

    let tx = null;

    if (coin === "BNB") {
      const url = `https://deep-index.moralis.io/api/v2.2/${wallet}?chain=${CHAIN}&limit=20`;

      const response = await fetch(url, {
        headers: { accept: "application/json", "X-API-Key": apiKey },
      });

      const data = await response.json();
      const result = data.result || [];

      tx = result.find(
        (item) =>
          item.to_address &&
          item.to_address.toLowerCase() === address &&
          item.value &&
          item.value !== "0"
      );

      if (!tx) return res.json({ success: false, message: "No BNB receive transaction found" });

      return res.json({
        success: true,
        type: "Receive BNB",
        hash: tx.hash,
        amount: Number(tx.value) / 1e18,
        coin: "BNB",
      });
    }

    const tokenAddress = TOKENS[coin];

    if (!tokenAddress) {
      return res.json({ success: false, message: "Token not supported" });
    }

    const url = `https://deep-index.moralis.io/api/v2.2/${wallet}/erc20/transfers?chain=${CHAIN}&token_addresses=${tokenAddress}&limit=20`;

    const response = await fetch(url, {
      headers: { accept: "application/json", "X-API-Key": apiKey },
    });

    const data = await response.json();
    const result = data.result || [];

    tx = result.find(
      (item) =>
        item.to_address &&
        item.to_address.toLowerCase() === address
    );

    if (!tx) {
      return res.json({ success: false, message: `No ${coin} receive transaction found` });
    }

    return res.json({
      success: true,
      type: `Receive ${coin}`,
      hash: tx.transaction_hash,
      amount: tx.value_decimal || tx.value,
      coin,
    });
  } catch (err) {
    console.log("Receive history error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});
// ALL HISTORY (BNB + USDT + EXALT)

router.get("/all-history", async (req, res) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet is required",
      });
    }

    const apiKey = process.env.MORALIS_API_KEY;

    const TOKENS = {
      EXALT: "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78",
      USDT: "0x55d398326f99059fF775485246999027B3197955",
    };

    const address = wallet.toLowerCase();

    let history = [];

    // BNB HISTORY
    const bnbResponse = await fetch(
      `https://deep-index.moralis.io/api/v2.2/${wallet}?chain=bsc&limit=20`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": apiKey,
        },
      }
    );

    const bnbData = await bnbResponse.json();

    if (bnbData.result) {
      const bnbTxs = bnbData.result.map((tx) => ({
        type:
          tx.to_address?.toLowerCase() === address
            ? "Receive BNB"
            : "Send BNB",
        hash: tx.hash,
        amount: tx.value,
        coin: "BNB",
        time: tx.block_timestamp,
      }));

      history.push(...bnbTxs);
    }

    // TOKEN HISTORY (USDT + EXALT)

    for (const [coin, contract] of Object.entries(TOKENS)) {
      const tokenResponse = await fetch(
        `https://deep-index.moralis.io/api/v2.2/${wallet}/erc20/transfers?chain=bsc&contract_addresses[]=${contract}&limit=20`,
        {
          headers: {
            accept: "application/json",
            "X-API-Key": apiKey,
          },
        }
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.result) {
  const verifiedTxs = tokenData.result.filter(
    (tx) =>
      tx.address &&
      tx.address.toLowerCase() === contract.toLowerCase()
  );

  const tokenTxs = verifiedTxs.map((tx) => ({
          type:
            tx.to_address?.toLowerCase() === address
              ? `Receive ${coin}`
              : `Send ${coin}`,
          hash: tx.transaction_hash,
          amount: tx.value_decimal || tx.value,
          coin,
          time: tx.block_timestamp,
        }));

        history.push(...tokenTxs);
      }
    }

    history.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    res.json({
      success: true,
      history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
module.exports = router;