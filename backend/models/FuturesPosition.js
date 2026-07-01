const mongoose = require("mongoose");

const futuresPositionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      enum: ["long", "short"],
      required: true,
      index: true,
    },

    entryPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    markPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    closePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    quantity: {
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

    marginMode: {
      type: String,
      enum: ["isolated", "cross"],
      default: "isolated",
    },

    margin: {
      type: Number,
      required: true,
      min: 0,
    },

    maintenanceMargin: {
      type: Number,
      default: 0,
      min: 0,
    },

    liquidationPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    takeProfit: {
      type: Number,
      default: 0,
    },

    stopLoss: {
      type: Number,
      default: 0,
    },

    unrealizedPnl: {
      type: Number,
      default: 0,
    },

    realizedPnl: {
      type: Number,
      default: 0,
    },

    fundingFee: {
      type: Number,
      default: 0,
    },

    pnl: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["open", "closed", "liquidated"],
      default: "open",
      index: true,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    liquidatedAt: {
      type: Date,
      default: null,
    },

    liquidationReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

futuresPositionSchema.index({
  userId: 1,
  status: 1,
});

futuresPositionSchema.index({
  symbol: 1,
  status: 1,
});

module.exports =
  mongoose.models.FuturesPosition ||
  mongoose.model("FuturesPosition", futuresPositionSchema);