const mongoose = require("mongoose");

const aiPortfolioSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

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
    default: 30,
  },

  diversification: {
    type: Number,
    default: 60,
  },

  health: {
    type: String,
    enum: ["Good", "Medium", "High Risk"],
    default: "Good",
  },

  assets: [
    {
      symbol: {
        type: String,
        required: true,
      },

      name: {
        type: String,
        default: "",
      },

      amount: {
        type: Number,
        default: 0,
      },

      value: {
        type: Number,
        default: 0,
      },

      allocation: {
        type: Number,
        default: 0,
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
      },

      message: {
        type: String,
        required: true,
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

module.exports = mongoose.model("AIPortfolio", aiPortfolioSchema);