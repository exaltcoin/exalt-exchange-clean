const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");
const SupportTicket = require("../models/SupportTicket");

/* USER: create support ticket */
router.post("/", protect, async (req, res) => {
  try {
    const { wallet, message } = req.body;

    if (!wallet || !message) {
      return res.status(400).json({
        success: false,
        message: "Wallet and message are required",
      });
    }

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      wallet,
      message,
      userName: req.user.name,
      userEmail: req.user.email,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Support ticket submitted",
      ticket,
    });
  } catch (error) {
    console.error("Create support ticket:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

/* ADMIN: get all tickets */
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error("Get support tickets:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

/* ADMIN: update ticket status */
router.post("/status", protect, adminOnly, async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !["pending", "open", "resolved", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid ticket ID and status required",
      });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      message: "Ticket status updated",
      ticket,
    });
  } catch (error) {
    console.error("Update support ticket:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

/* ADMIN: resolve ticket */
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        status: "resolved",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      message: "Ticket resolved",
      ticket,
    });
  } catch (error) {
    console.error("Resolve support ticket:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

module.exports = router;