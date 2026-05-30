const Order = require("../models/Order");
const Trade = require("../models/Trade");
const matchOrder = require("../services/matchingEngine");

exports.createOrder = async (req, res) => {
  try {
const order = await Order.create({
  ...req.body,
  remaining: req.body.amount,
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
    const orders = await Order.find({
      pair: req.params.pair,
    });

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
    const trades = await Trade.find({
      pair: req.params.pair,
    });

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