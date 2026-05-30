const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    pair: { type: String, required: true, uppercase: true },
    buyOrderId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Order",
},

sellOrderId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Order",
},

buyerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
},

sellerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
},
    price: { type: Number, required: true },
    amount: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trade", tradeSchema);