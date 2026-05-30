const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
},
    name: String,
    bank: String,
    amount: String,
    country: String,
    transactionId: String,
    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deposit", depositSchema);