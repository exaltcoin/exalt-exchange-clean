const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const SupportTicket = require("../models/SupportTicket");

// CREATE SUPPORT TICKET
router.post("/", protect, async (req, res) => {
  try {
  const { wallet, message, userName, userEmail } = req.body;
    if (!wallet || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const ticket = await SupportTicket.create({
      wallet,
      message,
      userName: userName || req.user.name,
      userEmail: userEmail || req.user.email,
      status: "pending",
    });

    res.json({
      success: true,
      message: "Support ticket submitted",
      ticket,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// GET ALL TICKETS
router.get("/", async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// UPDATE TICKET STATUS
router.post("/status", async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID and status required",
      });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status },
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
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// RESOLVE TICKET
router.put("/:id", async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status: "resolved" },
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
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;