const Staking = require("../models/Staking");
const UserWallet = require("../models/UserWallet");
const WalletLedger = require("../models/WalletLedger");

const getAllStakes = async (req, res) => {
  try {
    const stakes = await Staking.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(300);

    res.json({
      success: true,
      count: stakes.length,
      stakes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch all stakes",
      error: error.message,
    });
  }
};

const getStakingSummary = async (req, res) => {
  try {
    const totalActive = await Staking.countDocuments({ status: "active" });
    const totalCompleted = await Staking.countDocuments({ status: "completed" });
    const totalCancelled = await Staking.countDocuments({ status: "cancelled" });

    const totals = await Staking.aggregate([
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          totalRewards: { $sum: "$rewardEarned" },
        },
      },
    ]);

    res.json({
      success: true,
      summary: {
        totalActive,
        totalCompleted,
        totalCancelled,
        totals,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch staking summary",
      error: error.message,
    });
  }
};

const cancelStakeByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const stake = await Staking.findOne({
      _id: id,
      status: "active",
    });

    if (!stake) {
      return res.status(404).json({
        success: false,
        message: "Active stake not found or already processed",
      });
    }

    const coin = String(stake.coin || "EXALT").toUpperCase();
    const amount = Number(stake.amount || 0);

    const wallet = await UserWallet.findOneAndUpdate(
      { userId: stake.user },
      { $setOnInsert: { userId: stake.user } },
      { new: true, upsert: true }
    );

    const lockedBefore = Number(wallet.locked?.[coin] || 0);

    if (lockedBefore < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient locked staking balance",
      });
    }

    wallet.locked[coin] = lockedBefore - amount;

    const balanceBefore = Number(wallet.balances?.[coin] || 0);
    const balanceAfter = balanceBefore + amount;

    wallet.balances[coin] = balanceAfter;
    await wallet.save();

    stake.status = "cancelled";
    stake.cancelledAt = new Date();
    stake.notes = adminNote || "Stake cancelled by admin";
    await stake.save();

    await WalletLedger.create({
      userId: stake.user,
      type: "ADMIN_ADJUSTMENT",
      coin,
      amount,
      balanceBefore,
      balanceAfter,
      referenceId: stake._id,
      referenceModel: "Admin",
      status: "SUCCESS",
      note: "Admin cancelled stake and returned principal",
      createdBy: req.user._id,
    });

    res.json({
      success: true,
      message: "Stake cancelled and principal returned successfully",
      stake,
      wallet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel stake",
      error: error.message,
    });
  }
};

module.exports = {
  getAllStakes,
  getStakingSummary,
  cancelStakeByAdmin,
};