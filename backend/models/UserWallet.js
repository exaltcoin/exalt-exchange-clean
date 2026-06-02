const mongoose = require("mongoose");

const UserWalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    balances: {
      USDT: { type: Number, default: 0, min: 0 },
      BNB: { type: Number, default: 0, min: 0 },
      EXALT: { type: Number, default: 0, min: 0 },
    },

    locked: {
      USDT: { type: Number, default: 0, min: 0 },
      BNB: { type: Number, default: 0, min: 0 },
      EXALT: { type: Number, default: 0, min: 0 },
    },

    futuresBalance: {
      USDT: { type: Number, default: 0, min: 0 },
    },

    totalDeposited: {
      USDT: { type: Number, default: 0, min: 0 },
      BNB: { type: Number, default: 0, min: 0 },
      EXALT: { type: Number, default: 0, min: 0 },
    },

    totalWithdrawn: {
      USDT: { type: Number, default: 0, min: 0 },
      BNB: { type: Number, default: 0, min: 0 },
      EXALT: { type: Number, default: 0, min: 0 },
    },

    isFrozen: {
      type: Boolean,
      default: false,
    },

    freezeReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserWallet", UserWalletSchema);