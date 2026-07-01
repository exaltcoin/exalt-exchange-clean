const Deposit = require("../models/Deposit");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const UserWallet = require("../models/UserWallet");
const WalletLedger = require("../models/WalletLedger");

/* ADMIN: approve deposit */
exports.approveDeposit = async (req, res) => {
  try {
    const { id, adminRemark } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Deposit id is required",
      });
    }

    const deposit = await Deposit.findOne({
      _id: id,
      status: "pending",
    });

    if (!deposit) {
      return res.status(400).json({
        success: false,
        message: "Deposit not found or already processed",
      });
    }

    if (deposit.credited) {
      return res.status(400).json({
        success: false,
        message: "Deposit already credited",
      });
    }

    const coin = (deposit.coin || "USDT").toUpperCase();
    const amount = Number(deposit.amount);

    if (!["USDT", "BNB", "EXALT"].includes(coin)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported coin",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit amount",
      });
    }

    const wallet = await UserWallet.findOneAndUpdate(
      { userId: deposit.userId },
      { $setOnInsert: { userId: deposit.userId } },
      { new: true, upsert: true }
    );

    if (wallet.isFrozen) {
      return res.status(403).json({
        success: false,
        message: wallet.freezeReason || "User wallet is frozen",
      });
    }

    const balanceBefore = Number(wallet.balances?.[coin] || 0);
    const balanceAfter = balanceBefore + amount;

    wallet.balances[coin] = balanceAfter;
    wallet.totalDeposited[coin] =
      Number(wallet.totalDeposited?.[coin] || 0) + amount;

    await wallet.save();

    const ledger = await WalletLedger.create({
      userId: deposit.userId,
      type: "DEPOSIT_CREDIT",
      coin,
      amount,
      balanceBefore,
      balanceAfter,
      referenceId: deposit._id,
      referenceModel: "Deposit",
      status: "SUCCESS",
      note: "Deposit approved by admin",
      createdBy: req.user._id,
    });

    deposit.status = "approved";
    deposit.credited = true;
    deposit.creditedAt = new Date();
    deposit.creditedBy = req.user._id;
    deposit.walletLedgerId = ledger._id;
    deposit.approvedBy = req.user._id;
    deposit.approvedAt = new Date();
    deposit.adminRemark = adminRemark || "Deposit approved by admin";

    await deposit.save();

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
      wallet,
    });
  } catch (err) {
    console.error("Approve deposit error:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

/* ADMIN: approve/reject withdrawal */
exports.approveWithdrawal = async (req, res) => {
  try {
    const { id, status, txHash, adminRemark } = req.body;
    const finalStatus = status || "approved";

    if (!id || !["approved", "rejected"].includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Valid withdrawal id and status are required",
      });
    }

    const withdrawal = await Withdrawal.findOne({
      _id: id,
      status: "pending",
    });

    if (!withdrawal) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal not found or already processed",
      });
    }

    const coin = (withdrawal.coin || "USDT").toUpperCase();
    const amount = Number(withdrawal.amount);

    if (!["USDT", "BNB", "EXALT"].includes(coin)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported coin",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal amount",
      });
    }

    if (finalStatus === "approved") {
      withdrawal.status = "approved";
      withdrawal.approvedBy = req.user._id;
      withdrawal.approvedAt = new Date();
      withdrawal.processedBy = req.user._id;
      withdrawal.processedAt = new Date();
      withdrawal.txHash = txHash || "";
      withdrawal.adminRemark = adminRemark || "Withdrawal approved by admin";
    }

    if (finalStatus === "rejected") {
      const wallet = await UserWallet.findOneAndUpdate(
        { userId: withdrawal.userId },
        { $setOnInsert: { userId: withdrawal.userId } },
        { new: true, upsert: true }
      );

      const balanceBefore = Number(wallet.balances?.[coin] || 0);
      const balanceAfter = balanceBefore + amount;

      wallet.balances[coin] = balanceAfter;
      await wallet.save();

      await WalletLedger.create({
        userId: withdrawal.userId,
        type: "WITHDRAWAL_REFUND",
        coin,
        amount,
        balanceBefore,
        balanceAfter,
        referenceId: withdrawal._id,
        referenceModel: "Withdrawal",
        status: "SUCCESS",
        note: "Withdrawal rejected and refunded",
        createdBy: req.user._id,
      });

      withdrawal.status = "rejected";
      withdrawal.rejectedBy = req.user._id;
      withdrawal.rejectedAt = new Date();
      withdrawal.processedBy = req.user._id;
      withdrawal.processedAt = new Date();
      withdrawal.adminRemark = adminRemark || "Withdrawal rejected and refunded";
    }

    await withdrawal.save();

    await Transaction.findOneAndUpdate(
      { withdrawalId: withdrawal._id, type: "withdrawal" },
      {
        status: finalStatus,
        note:
          finalStatus === "approved"
            ? "Withdrawal approved by admin"
            : "Withdrawal rejected and refunded",
        toHash: withdrawal.walletAddress,
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
      message: err.message || "Server error",
    });
  }
};