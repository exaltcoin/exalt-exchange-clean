const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
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
      default: "",
      trim: true,
      maxlength: 40,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
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
      maxlength: 80,
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
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Kyc || mongoose.model("Kyc", kycSchema);