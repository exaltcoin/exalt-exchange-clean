const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    pair: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },

    buyOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    sellOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    buyerFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellerFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    feeCoin: {
      type: String,
      default: "USDT",
      uppercase: true,
    },

    maker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    taker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["SUCCESS", "CANCELLED", "REVERSED"],
      default: "SUCCESS",
      index: true,
    },

    source: {
      type: String,
      enum: ["SPOT", "P2P", "FUTURES"],
      default: "SPOT",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

tradeSchema.index({ pair: 1, createdAt: -1 });
tradeSchema.index({ buyerId: 1, createdAt: -1 });
tradeSchema.index({ sellerId: 1, createdAt: -1 });

module.exports =
  mongoose.models.Trade ||
  mongoose.model("Trade", tradeSchema);