const Order = require("../models/Order");
const Trade = require("../models/Trade");
const matchOrder = require("../services/matchingEngine");

exports.createOrder = async (req, res) => {
  try {
    const { pair, side, type, price, amount } = req.body;

    if (!pair || !side || !amount) {
      return res.status(400).json({
        success: false,
        message: "Pair, side and amount are required",
      });
    }

    const order = await Order.create({
      userId: req.user._id,
      pair: String(pair).toUpperCase(),
      side,
      type: type || "limit",
      price: Number(price || 0),
      amount: Number(amount),
      remaining: Number(amount),
      status: "open",
    });

    const matchedOrder = await matchOrder(order);

    res.json({
      success: true,
      order: matchedOrder,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getOrderBook = async (req, res) => {
  try {
    const pair = String(req.params.pair || "").toUpperCase();

    const orders = await Order.find({
      pair,
      status: { $in: ["open", "partial"] },
    })
      .sort({ price: -1, createdAt: 1 })
      .limit(200);

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getTrades = async (req, res) => {
  try {
    const pair = String(req.params.pair || "").toUpperCase();

    const trades = await Trade.find({ pair })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      trades,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllTrades = async (req, res) => {
  try {
    const trades = await Trade.find()
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({
      success: true,
      trades,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};