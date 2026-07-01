const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
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

    txHash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
  type: String,
  default: "",
  trim: true,
  lowercase: true,
  index: true,
},

coin: {
  type: String,
  default: "USDT",
  uppercase: true,
  trim: true,
  index: true,
},

transactionId: {
  type: String,
  default: "",
  trim: true,
},

proofUrl: {
  type: String,
  default: "",
  trim: true,
},
paymentMethod: {
  type: String,
  enum: ["EASYPAISA", "JAZZCASH", "BANK", "CRYPTO"],
  default:"CRYPTO",
  required: true,
  uppercase: true,
  index: true,
},

senderName: {
  type: String,
  default: "",
  trim: true,
  maxlength: 100,
},

senderAccount: {
  type: String,
  default: "",
  trim: true,
  maxlength: 100,
},

receiptImage: {
  type: String,
  default: "",
  trim: true,
},

currency: {
  type: String,
  default: "PKR",
  uppercase: true,
  trim: true,
},

credited: {
  type: Boolean,
  default: false,
  index: true,
},

creditedAt: {
  type: Date,
  default: null,
},

creditedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

walletLedgerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "WalletLedger",
  default: null,
},

adminRemark: {
  type: String,
  default: "",
  trim: true,
  maxlength: 500,
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

    note: {
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

module.exports = mongoose.model("Deposit", depositSchema);