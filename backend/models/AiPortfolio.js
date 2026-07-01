const mongoose = require("mongoose");

const aiPortfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    totalValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalProfitLoss: {
      type: Number,
      default: 0,
    },

    riskScore: {
      type: Number,
      default: 30,
      min: 0,
      max: 100,
    },

    diversification: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },

    health: {
      type: String,
      enum: ["Good", "Medium", "High Risk"],
      default: "Good",
      index: true,
    },

    assets: [
      {
        symbol: {
          type: String,
          required: true,
          uppercase: true,
          trim: true,
        },

        name: {
          type: String,
          default: "",
          trim: true,
        },

        amount: {
          type: Number,
          default: 0,
          min: 0,
        },

        value: {
          type: Number,
          default: 0,
          min: 0,
        },

        allocation: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },

        pnl: {
          type: Number,
          default: 0,
        },
      },
    ],

    suggestions: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },

        message: {
          type: String,
          required: true,
          trim: true,
        },

        type: {
          type: String,
          enum: [
            "info",
            "warning",
            "success",
            "danger",
            "buy",
            "sell",
            "hold",
            "rebalance",
            "risk",
          ],
          default: "info",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    history: [
      {
        totalValue: {
          type: Number,
          default: 0,
        },

        totalProfitLoss: {
          type: Number,
          default: 0,
        },

        riskScore: {
          type: Number,
          default: 0,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

aiPortfolioSchema.index({ userId: 1 });
aiPortfolioSchema.index({ riskScore: -1 });
aiPortfolioSchema.index({ updatedAt: -1 });

module.exports =
  mongoose.models.AIPortfolio ||
  mongoose.model("AIPortfolio", aiPortfolioSchema);