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

    pair: {
  type: String,
  default: "BTC/USDT",
  uppercase: true,
  trim: true,
  index: true,
},

    pair: {
      type: String,
      default: "BTC/USDT",
    },

  tradeType: {
  type: String,
  enum: ["Spot", "Futures", "P2P", "General"],
  default: "General",
  index: true,
},

    sentiment: {
  type: String,
  enum: ["Bullish", "Bearish", "Neutral"],
  default: "Neutral",
  index: true,
},
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
shares: {
  type: Number,
  default: 0,
  min: 0,
},
    comments: [commentSchema],
  },
  { timestamps: true }
);
socialPostSchema.index({ trader: 1, createdAt: -1 });
socialPostSchema.index({ pair: 1, createdAt: -1 });
socialPostSchema.index({ sentiment: 1 });
module.exports =
  mongoose.models.SocialPost ||
  mongoose.model("SocialPost", socialPostSchema);