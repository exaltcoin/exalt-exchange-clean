const mongoose = require("mongoose");

const WalletLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "DEPOSIT_CREDIT",
        "WITHDRAWAL_DEBIT",
        "WITHDRAWAL_REFUND",
        "ADMIN_ADJUSTMENT",
        "FUTURES_PNL",
        "BONUS",
        "REFERRAL_REWARD",
      ],
      index: true,
    },

    coin: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["USDT", "BNB", "EXALT"],
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    referenceModel: {
      type: String,
      enum: ["Deposit", "Withdrawal", "Trade", "FuturesPosition", "Admin", null],
      default: null,
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "REVERSED"],
      default: "SUCCESS",
      index: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

WalletLedgerSchema.index(
  { referenceId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { referenceId: { $type: "objectId" } },
  }
);

module.exports = mongoose.model("WalletLedger", WalletLedgerSchema);