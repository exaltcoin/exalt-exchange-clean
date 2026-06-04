const mongoose = require("mongoose");
const kycSchema = new mongoose.Schema(
  {
    userId: String,
    fullName: String,
    email: String,
    country: String,
    walletAddress: String,
    idType: String,
    idNumber: String,
    telegramUsername: String,
    projectName: String,

    status: {
      type: String,
      default: "pending",
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);