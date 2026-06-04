const mongoose = require("mongoose");
const kycSchema = new mongoose.Schema(
  {
    userId: String,
    fullName: String,
    email: String,
    phone: String,
    country: String,
    idType: String,
    idNumber: String,

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