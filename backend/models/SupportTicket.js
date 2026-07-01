const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    wallet: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    userName: {
      type: String,
      default: "",
      trim: true,
    },

    userEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
      index: true,
    },

    category: {
      type: String,
      enum: [
        "general",
        "deposit",
        "withdrawal",
        "p2p",
        "trading",
        "listing",
        "kyc",
        "security",
        "wallet",
        "other",
      ],
      default: "general",
      index: true,
    },

    adminReply: {
      type: String,
      default: "",
      trim: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "open", "resolved", "closed"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", supportTicketSchema);