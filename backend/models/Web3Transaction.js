const mongoose = require("mongoose");

const Web3TransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    wallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["Receive", "Send", "Swap"],
      index: true,
    },

    coin: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    hash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    fromAddress: {
      type: String,
      default: "",
      lowercase: true,
    },

    toAddress: {
      type: String,
      default: "",
      lowercase: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
      index: true,
    },

    chain: {
      type: String,
      default: "BSC",
      index: true,
    },

    blockNumber: {
      type: Number,
      default: null,
    },

    gasFee: {
      type: Number,
      default: 0,
    },

    source: {
      type: String,
      default: "web3-wallet",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Web3Transaction",
  Web3TransactionSchema
);