const mongoose = require("mongoose");

const futuresOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FuturesPosition",
      default: null,
      index: true,
    },

    symbol: {
      type: String,
      required: true,
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
      default: "market",
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    leverage: {
      type: Number,
      default: 10,
      min: 1,
      max: 125,
    },

    status: {
      type: String,
      enum: ["filled", "pending", "cancelled", "failed"],
      default: "filled",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

futuresOrderSchema.index({ userId: 1, createdAt: -1 });
futuresOrderSchema.index({ symbol: 1, createdAt: -1 });

module.exports =
  mongoose.models.FuturesOrder ||
  mongoose.model("FuturesOrder", futuresOrderSchema);