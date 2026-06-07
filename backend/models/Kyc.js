const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    idType: {
      type: String,
      enum: ["CNIC", "Passport", "Driving License", "National ID"],
      default: "CNIC",
      required: true,
    },
    idNumber: {
      type: String,
      required: true,
      trim: true,
    },

    cnicFront: {
      type: String,
      default: "",
    },

    cnicBack: {
      type: String,
      default: "",
    },

    passportImage: {
      type: String,
      default: "",
    },

    selfieImage: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "pending",
    },

    adminNote: {
      type: String,
      default: "",
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Kyc || mongoose.model("Kyc", kycSchema);