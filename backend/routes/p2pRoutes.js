const express = require("express");
const router = express.Router();

const P2POrder = require("../models/P2POrder");
const User = require("../models/user");
const Transaction = require("../models/Transaction");
// Create P2P ad
router.post("/create", async (req, res) => {
  try {
    const {
      sellerId,
      asset,
      fiat,
      type,
      price,
      amount,
      paymentMethod,
      walletAddress,
    } = req.body;

    if (!sellerId || !type || !price || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "sellerId, type, price, amount, paymentMethod required",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (type === "sell") {
      if ((seller.wallets?.EXALT || 0) < Number(amount)) {
        return res.status(400).json({
          success: false,
          message: "Insufficient EXALT balance",
        });
      }

      seller.wallets.EXALT -= Number(amount);
      await seller.save();
    }
    const order = await P2POrder.create({
      sellerId,
      asset: asset || "EXALT",
      fiat: fiat || "KWD",
      type,
      price: Number(price),
      amount: Number(amount),
      remaining: Number(amount),
      paymentMethod,
      walletAddress: walletAddress || "",
      status: "open",
    });
await Transaction.create({
  userId: sellerId,
  type: "P2P_ORDER_CREATED",
  amount: Number(amount),
  asset: asset || "EXALT",
  status: "completed",
  note: `P2P ${type} order created`,
});
    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all P2P ads
router.get("/orders", async (req, res) => {
  try {
    const orders = await P2POrder.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Buyer accepts order
router.post("/:id/accept", async (req, res) => {
  try {
    const { buyerId } = req.body;

    const order = await P2POrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "P2P order not found",
      });
    }

    if (order.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Order is not open",
      });
    }

    order.buyerId = buyerId;
    order.status = "matched";
await Transaction.create({
  userId: buyerId,
  type: "P2P_ORDER_ACCEPTED",
  amount: Number(order.amount),
  asset: order.asset || "EXALT",
  status: "completed",
  note: "P2P order accepted",
});
    await order.save();

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Buyer marks paid
router.post("/:id/paid", async (req, res) => {
  try {
    const { paymentProof } = req.body;

    const order = await P2POrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "P2P order not found",
      });
    }

    order.paymentProof = paymentProof || "";
    order.status = "paid";
await Transaction.create({
 userId: order.buyerId,
 type: "P2P_PAYMENT_MARKED",
  amount: Number(order.amount),
  asset: order.asset || "EXALT",
  status: "completed",
  note: "P2P payment marked as paid",
});
    await order.save();

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Admin releases escrow
router.post("/:id/release", async (req, res) => {
  try {
    const order = await P2POrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "P2P order not found",
      });
    }

    if (order.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Order must be paid before release",
      });
    }

    const buyer = await User.findById(order.buyerId);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer not found",
      });
    }

   if (!buyer.wallets) buyer.wallets = {};
buyer.wallets.EXALT = Number(buyer.wallets.EXALT || 0) + Number(order.amount);
    await buyer.save();

    order.status = "released";
    order.remaining = 0;
    if (!order.buyerId) {
  return res.status(400).json({
    success: false,
    message: "Buyer ID missing",
  });
}
await Transaction.create({
  userId: order.buyerId,
  type: "P2P_ORDER_RELEASED",
  amount: Number(order.amount),
  asset: order.asset || "EXALT",
  status: "completed",
  note: "P2P escrow released to buyer",
});
    await order.save();

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// Seller cancels order and gets escrow refund
router.post("/:id/cancel", async (req, res) => {
  try {
    const order = await P2POrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "P2P order not found",
      });
    }

    if (order.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open orders can be cancelled",
      });
    }

    const seller = await User.findById(order.sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (!seller.wallets) seller.wallets = {};

    seller.wallets.EXALT =
      Number(seller.wallets.EXALT || 0) + Number(order.amount);

    await seller.save();

    order.status = "cancelled";

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled and escrow refunded",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// Admin: get all P2P orders
router.get("/admin/all", async (req, res) => {
  try {
    const orders = await P2POrder.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
module.exports = router;