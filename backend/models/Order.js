const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    pair: {
      type: String,
      default: "EXALT/USDT",
    },

    type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    filled: {
      type: Number,
      default: 0,
    },

    remaining: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "partial", "filled", "cancelled"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);