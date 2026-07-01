const express = require("express");
const router = express.Router();

const P2POrder = require("../models/P2POrder");
const Transaction = require("../models/Transaction");
const cloudinary = require("../services/cloudinaryService");
const {
  lockBalance,
  releaseBalance,
  addBalance,
} = require("../services/walletService");

const multer = require("multer");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/* USER: Create P2P ad */
router.post("/create", protect, async (req, res) => {
  try {
    const {
      asset,
      fiat,
      type,
      price,
      amount,
      paymentMethod,
      walletAddress,
      country,
      countryFlag,
    } = req.body;

    const sellerId = req.user._id;

    if (!type || !price || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "type, price, amount and paymentMethod are required",
      });
    }

    if (!["buy", "sell"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid P2P order type",
      });
    }

    const selectedAsset = (asset || "EXALT").toUpperCase();
    const orderAmount = Number(amount);

    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    if (type === "sell") {
      await lockBalance(sellerId, selectedAsset, orderAmount);
    }

    const order = await P2POrder.create({
      sellerId,
      asset: selectedAsset,
      fiat: fiat || "KWD",
      type,
      price: Number(price),
      amount: orderAmount,
      remaining: orderAmount,
      paymentMethod,
      walletAddress: walletAddress || "",
      country: country || "Global",
      countryFlag: countryFlag || "🌍",
      status: "open",
    });

    await Transaction.create({
      userId: sellerId,
      type: "p2p",
      amount: orderAmount,
      coin: selectedAsset,
      status: "success",
      note: "P2P order created",
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

/* PUBLIC: Get all P2P ads */
router.get("/orders", async (req, res) => {
  try {
    const orders = await P2POrder.find()
      .populate("sellerId", "name email")
      .populate("buyerId", "name email")
      .sort({ createdAt: -1 });

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

/* USER: Buyer accepts order */
router.post("/:id/accept", protect, async (req, res) => {
  try {
    const buyerId = req.user._id;

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

    if (String(order.sellerId) === String(buyerId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot accept your own order",
      });
    }

    order.buyerId = buyerId;
    order.status = "matched";

    await order.save();

    await Transaction.create({
      userId: buyerId,
      type: "P2P_ORDER_ACCEPTED",
      amount: Number(order.amount),
      coin: order.asset || "EXALT",
      status: "completed",
      note: "P2P order accepted",
    });

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

/* USER: Buyer marks paid */
router.post("/:id/paid", protect, upload.single("proof"), async (req, res) => {
  try {
    let paymentProof = "";

    const order = await P2POrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "P2P order not found",
      });
    }

    if (String(order.buyerId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only buyer can mark this order as paid",
      });
    }

    if (order.status !== "matched") {
      return res.status(400).json({
        success: false,
        message: "Order must be matched before marking paid",
      });
    }

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

    order.paymentProof = paymentProof;
    order.status = "paid";

    await order.save();

    await Transaction.create({
      userId: order.buyerId,
      type: "P2P_PAYMENT_MARKED",
      amount: Number(order.amount),
      coin: order.asset || "EXALT",
      status: "completed",
      note: "P2P payment marked as paid",
    });

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

/* ADMIN: Release escrow */
router.post("/:id/release", protect, adminOnly, async (req, res) => {
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

    await addBalance(order.buyerId, order.asset || "EXALT", Number(order.amount));

    order.status = "released";
    order.remaining = 0;

    await order.save();

    await Transaction.create({
      userId: order.buyerId,
      type: "P2P_ORDER_RELEASED",
      amount: Number(order.amount),
      coin: order.asset || "EXALT",
      status: "completed",
      note: "P2P escrow released to buyer",
    });

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

/* USER: Seller cancels open order */
router.post("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await P2POrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "P2P order not found",
      });
    }

    if (String(order.sellerId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only seller can cancel this order",
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

    await Transaction.create({
      userId: order.sellerId,
      type: "P2P_ORDER_CANCELLED",
      amount: Number(order.amount),
      coin: order.asset || "EXALT",
      status: "completed",
      note: "P2P order cancelled and escrow refunded",
    });

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

/* ADMIN: Get all P2P orders */
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const orders = await P2POrder.find()
      .populate("sellerId", "name email")
      .populate("buyerId", "name email")
      .sort({ createdAt: -1 });

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