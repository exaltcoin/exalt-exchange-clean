const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const socialPostSchema = new mongoose.Schema(
  {
    trader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    image: {
      type: String,
      default: "",
    },

    pair: {
      type: String,
      default: "BTC/USDT",
    },

    tradeType: {
      type: String,
      enum: ["Spot", "Futures", "P2P", "General"],
      default: "General",
    },

    sentiment: {
      type: String,
      enum: ["Bullish", "Bearish", "Neutral"],
      default: "Neutral",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocialPost", socialPostSchema);