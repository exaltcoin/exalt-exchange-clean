const mongoose = require("mongoose");

const LearnEarnSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    lessonId: {
      type: Number,
      required: true,
    },

    lessonTitle: {
      type: String,
      required: true,
      trim: true,
    },

    reward: {
      type: Number,
      required: true,
      min: 0,
    },

    coin: {
      type: String,
      default: "EXALT",
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["completed", "claimed"],
      default: "completed",
    },

    completedAt: {
      type: Date,
      default: Date.now,
    },

    claimedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

LearnEarnSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model("LearnEarn", LearnEarnSchema);