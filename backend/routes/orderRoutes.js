const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const User = require("../models/user");

const matchOrder = require("../services/matchingEngine");

router.post("/", async (req, res) => {
  try {
    const { userId, pair, type, price, amount } = req.body;

    if (!userId || !type || !price || !amount) {
      return res.status(400).json({
        success: false,
        message: "userId, type, price, amount required",
      });
    }
const user = await User.findById(userId);

if (!user) {
  return res.status(404).json({
    success: false,
    message: "User not found",
  });
}

if (type === "buy") {
  const totalCost = Number(price) * Number(amount);

  if (user.wallets.USDT < totalCost) {
    return res.status(400).json({
      success: false,
      message: "Insufficient USDT balance",
    });
  }

  user.wallets.USDT -= totalCost;
}

if (type === "sell") {
  if (user.wallets.EXALT < Number(amount)) {
    return res.status(400).json({
      success: false,
      message: "Insufficient EXALT balance",
    });
  }

  user.wallets.EXALT -= Number(amount);
}

await user.save();
    const order = await Order.create({
      userId,
      pair: pair || "EXALT/USDT",
      type,
      price: Number(price),
      amount: Number(amount),
      filled: 0,
      remaining: Number(amount),
      status: "open",
    });

    const matchedOrder = await matchOrder(order);

    res.status(201).json({
      success: true,
      order: matchedOrder,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/create", async (req, res) => {
  req.url = "/";
  router.handle(req, res);
});

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;