const mongoose = require("mongoose");

const utilityToolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    route: {
      type: String,
      default: "",
      trim: true,
    },

    icon: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Trading",
        "Risk",
        "Market",
        "Portfolio",
        "EXALT",
        "Calculator",
      ],
      default: "Trading",
      index: true,
    },

    description: {
      type: String,
      default: "",
      maxlength: 1500,
    },

    accessType: {
      type: String,
      enum: ["Free", "Premium", "EXALT Holder"],
      default: "Free",
      index: true,
    },

    requiredExalt: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Paused",
        "Coming Soon",
        "Inactive",
      ],
      default: "Active",
      index: true,
    },

    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    adminReviewed: {
      type: Boolean,
      default: false,
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

utilityToolSchema.index({
  category: 1,
  featured: -1,
});

utilityToolSchema.index({
  status: 1,
  accessType: 1,
});

module.exports =
  mongoose.models.ExaltUtility ||
  mongoose.model("ExaltUtility", utilityToolSchema);