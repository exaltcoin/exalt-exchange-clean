const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  type: {
    type: String,
    default: "deposit"
  },

  amount: {
    type: Number,
    required: true,
    default: 0
  },

  status: {
    type: String,
    default: "approved"
  },

  note: {
    type: String,
    default: ""
  },

  txHash: {
    type: String,
    default: ""
  }
},
{
  timestamps: true
}
);

module.exports = mongoose.model("Transaction", transactionSchema);