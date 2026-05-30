const mongoose = require("mongoose");

const p2pOrderSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true },
    buyerId: { type: String, default: "" },

    asset: { type: String, default: "EXALT" },
    fiat: { type: String, default: "KWD" },
    type: { type: String, enum: ["buy", "sell"], required: true },

    price: { type: Number, required: true },
    amount: { type: Number, required: true },
    remaining: { type: Number, required: true },

    paymentMethod: { type: String, required: true },
    walletAddress: { type: String, default: "" },
    paymentProof: { type: String, default: "" },

    status: {
      type: String,
      enum: ["open", "matched", "paid", "released", "cancelled", "disputed"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.P2POrder || mongoose.model("P2POrder", p2pOrderSchema);