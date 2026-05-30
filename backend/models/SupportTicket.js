const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "closed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);