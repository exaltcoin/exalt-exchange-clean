const express = require("express");
const router = express.Router();

const P2POrder = require("../models/P2POrder");
const User = require("../models/user");
const Transaction = require("../models/Transaction");
const cloudinary = require("../services/cloudinaryService");
const {
  lockBalance,
  releaseBalance,
  addBalance,
} = require("../services/walletService");
const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
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
  await lockBalance(sellerId, asset || "EXALT", Number(amount));
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
router.post(
  "/:id/paid",
  upload.single("proof"),
  async (req, res) => {
  try {
   let paymentProof = "";

if (req.file) {
  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "exalt-exchange/p2p-proofs",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      )
      .end(req.file.buffer);
  });

  paymentProof = uploadResult.secure_url;
}
    const order = await P2POrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "P2P order not found",
      });
    }

    order.paymentProof = paymentProof;
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

   if (!order.buyerId) {
  return res.status(400).json({
    success: false,
    message: "Buyer ID missing",
  });
}

await addBalance(
  order.buyerId,
  order.asset || "EXALT",
  Number(order.amount)
);
    order.status = "released";
    order.remaining = 0;
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
   await releaseBalance(order.sellerId, order.asset || "EXALT", Number(order.amount));
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