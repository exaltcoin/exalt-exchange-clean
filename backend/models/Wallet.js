const mongoose = require("mongoose");

const balanceSchema = new mongoose.Schema(
  {
    coin: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: ["USDT", "BTC", "ETH", "BNB", "EXALT"],
    },

    available: {
      type: Number,
      default: 0,
      min: 0,
    },

    locked: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    balances: {
      type: [balanceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Wallet ||
  mongoose.model("Wallet", walletSchema);