const mongoose = require("mongoose");

const futuresPositionSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    symbol: {
        type: String,
        required: true,
    },

    side: {
        type: String,
        enum: ["long", "short"],
        required: true,
    },

    entryPrice: {
        type: Number,
        required: true,
    },

    markPrice: {
        type: Number,
        default: 0,
    },

    quantity: {
        type: Number,
        required: true,
    },

    leverage: {
        type: Number,
        default: 10,
    },

    margin: {
        type: Number,
        required: true,
    },

    liquidationPrice: {
        type: Number,
        default: 0,
    },

    takeProfit: {
        type: Number,
        default: 0,
    },

    stopLoss: {
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
    },
},
{ timestamps: true }
);

module.exports = mongoose.model(
    "FuturesPosition",
    futuresPositionSchema
);