const Deposit = require("../models/Deposit");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/user");
const Transaction = require("../models/Transaction");
const UserWallet = require("../models/UserWallet");
// ADMIN: approve deposit
exports.approveDeposit = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Deposit id is required",
      });
    }

    const deposit = await Deposit.findOneAndUpdate(
      { _id: id, status: "pending" },
      {
        status: "approved",
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!deposit) {
      return res.status(400).json({
        success: false,
        message: "Deposit not found or already processed",
      });
    }

 const coin = (deposit.coin || "EXALT").toUpperCase();
await UserWallet.findOneAndUpdate(
  { userId: deposit.userId },
  {
    $inc: {
      [`balances.${coin}`]: Number(deposit.amount),
      [`totalDeposited.${coin}`]: Number(deposit.amount),
    },
  },
  { upsert: true, new: true }
);
    await Transaction.findOneAndUpdate(
      { depositId: deposit._id, type: "deposit" },
      {
        status: "approved",
        note: "Deposit approved by admin",
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Deposit approved successfully",
      deposit,
    });
  } catch (err) {
    console.error("Approve deposit error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ADMIN: approve withdrawal
exports.approveWithdrawal = async (req, res) => {
  try {
    const { id, status } = req.body;

    const finalStatus = status || "approved";

    if (!id || !["approved", "rejected"].includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Valid withdrawal id and status are required",
      });
    }

    const withdrawal = await Withdrawal.findOneAndUpdate(
      { _id: id, status: "pending" },
      {
        status: finalStatus,
        processedBy: req.user._id,
        processedAt: new Date(),
      },
      { new: true }
    );

    if (!withdrawal) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal not found or already processed",
      });
    }

   if (finalStatus === "rejected") {
  const coin = (withdrawal.coin || "USDT").toUpperCase();

  await UserWallet.findOneAndUpdate(
    { userId: withdrawal.userId },
    {
      $inc: {
        [`balances.${coin}`]: Number(withdrawal.amount),
      },
    },
    { upsert: true, new: true }
  );
}

    await Transaction.findOneAndUpdate(
      { withdrawalId: withdrawal._id, type: "withdrawal" },
      {
        status: finalStatus,
        note:
          finalStatus === "approved"
            ? "Withdrawal approved by admin"
            : "Withdrawal rejected and refunded",
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Withdrawal ${finalStatus} successfully`,
      withdrawal,
    });
  } catch (err) {
    console.error("Approve withdrawal error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};