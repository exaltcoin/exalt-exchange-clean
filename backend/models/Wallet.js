const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    balances: [
      {
        coin: { type: String, required: true, uppercase: true },
        available: { type: Number, default: 0 },
        locked: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);