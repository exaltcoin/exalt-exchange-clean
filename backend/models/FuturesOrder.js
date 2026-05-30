const mongoose = require("mongoose");

const futuresOrderSchema = new mongoose.Schema(
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
        enum: ["buy", "sell"],
        required: true,
    },

    type: {
        type: String,
        enum: ["market", "limit"],
        default: "market",
    },

    quantity: {
        type: Number,
        required: true,
    },

    price: {
        type: Number,
        required: true,
    },

    leverage: {
        type: Number,
        default: 10,
    },

    status: {
        type: String,
        enum: ["filled", "pending", "cancelled"],
        default: "filled",
    },
},
{ timestamps: true }
);

module.exports = mongoose.model(
    "FuturesOrder",
    futuresOrderSchema
);