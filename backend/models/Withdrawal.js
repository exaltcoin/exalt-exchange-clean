const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    coin: {
      type: String,
      enum: ["USDT", "BNB", "EXALT"],
      default: "USDT",
      uppercase: true,
      required: true,
      index: true,
    },

    walletAddress: {
      type: String,
      required: true,
      trim: true,
    },

    txHash: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    walletLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletLedger",
      default: null,
    },

    network: {
      type: String,
      enum: ["BSC", "ERC20", "TRC20", "SOL"],
      default: "BSC",
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    adminRemark: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Withdrawal ||
  mongoose.model("Withdrawal", withdrawalSchema);