const Staking = require("../models/Staking");

const getAllStakes = async (req, res) => {
  try {
    const stakes = await Staking.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

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

    const stake = await Staking.findById(id);

    if (!stake) {
      return res.status(404).json({
        success: false,
        message: "Stake not found",
      });
    }

    stake.status = "cancelled";
    await stake.save();

    res.json({
      success: true,
      message: "Stake cancelled successfully",
      stake,
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