const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    pair: {
      type: String,
      default: "EXALT/USDT",
      uppercase: true,
      index: true,
    },

    side: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["market", "limit"],
      default: "limit",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    filled: {
      type: Number,
      default: 0,
      min: 0,
    },

    remaining: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["open", "partial", "filled", "cancelled"],
      default: "open",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ pair: 1, side: 1, price: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });

module.exports =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);