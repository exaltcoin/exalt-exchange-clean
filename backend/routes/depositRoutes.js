const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const Transaction = require("../models/Transaction");
const User = require("../models/user");
router.get("/", async (req, res) => {
  try {
    const requests = await Deposit.find().sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const request = await Deposit.create(req.body);
    res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/status", async (req, res) => {
  try {
    const { id, status } = req.body;

    const request = await Deposit.findByIdAndUpdate(
  id,
  { status },
  { new: true }
);

if (status === "approved") {
  await Transaction.create({
    userId: request.userId || null,
    type: "deposit",
    amount: Number(request.amount),
    status: "approved",
    note: "Deposit approved by admin",
    txHash: request.transactionId || request.txHash || ""
  });
}
if (request.userId) {
  await User.findByIdAndUpdate(
    request.userId,
    {
      $inc: { balance: Number(request.amount) },
    }
  );
}
await request.save();
    res.json({ success: true, message: "Deposit updated", request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;