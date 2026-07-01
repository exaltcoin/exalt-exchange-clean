const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: [
        "Deposit",
        "Withdrawal",
        "Trade",
        "Futures",
        "P2P",
        "KYC",
        "Reward",
        "Security",
        "Achievement",
        "System",
      ],
      default: "System",
      index: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Critical"],
      default: "Normal",
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },

    actionUrl: {
      type: String,
      default: "",
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ isGlobal: 1, createdAt: -1 });

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);