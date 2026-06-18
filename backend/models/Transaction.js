const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    type: {
  type: String,
  enum: [
    "deposit",
    "withdrawal",
    "trade",
    "reward",
    "fee",
    "adjustment",
    "p2p",
    "P2P_ORDER_CREATED",
    "P2P_ORDER_RELEASED"
  ],
  required: true
},

    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

   status: {
  type: String,
  enum: [
    "pending",
    "approved",
    "rejected",
    "failed",
    "completed",
    "success"
  ],
  default: "pending"
},

    txHash: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    depositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      default: null,
    },

    withdrawalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Withdrawal",
      default: null,
    },

    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);