const mongoose = require("mongoose");

const coinSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    symbol: { type: String, required: true, uppercase: true },
    pair: { type: String, required: true, uppercase: true },
    logo: { type: String, default: "" },
    price: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coin", coinSchema);