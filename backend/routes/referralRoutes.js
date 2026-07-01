const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const EXALT_REWARD = Number(process.env.REFERRAL_REWARD_EXALT || 100);

const createNotificationSafe = async ({
  userId,
  title,
  message,
  type = "Reward",
  priority = "Normal",
}) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      priority,
      isRead: false,
      isGlobal: false,
    });
  } catch (error) {
    console.log("Notification create failed:", error.message);
  }
};

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select(
        "name email referralCode referredByCode referralCount pendingReferralRewards approvedReferralRewards referralRewards"
      )
      .populate("referredBy", "name email referralCode");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      referral: {
        referralCode: user.referralCode,
        referralLink: `https://exaltexchange.io/ref/${user.referralCode}`,
        referredByCode: user.referredByCode || "",
        referralCount: user.referralCount || 0,
        pendingReferralRewards: user.pendingReferralRewards || 0,
        approvedReferralRewards: user.approvedReferralRewards || 0,
        rewards: user.referralRewards || [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Referral data failed",
      error: error.message,
    });
  }
});

router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { referralCount: { $gt: 0 } },
        { "referralRewards.0": { $exists: true } },
      ],
    })
      .select(
        "name email referralCode referralCount pendingReferralRewards approvedReferralRewards referralRewards wallets"
      )
      .sort({ updatedAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin referral data failed",
      error: error.message,
    });
  }
});

router.put(
  "/admin/:userId/reward/:rewardId/status",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { status, note } = req.body;

      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid reward status",
        });
      }

      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Referrer user not found",
        });
      }

      const reward = user.referralRewards.id(req.params.rewardId);

      if (!reward) {
        return res.status(404).json({
          success: false,
          message: "Reward not found",
        });
      }

      const oldStatus = reward.status;
      const amount = Number(reward.rewardAmount || EXALT_REWARD);

      if (oldStatus === status) {
        return res.json({
          success: true,
          message: `Referral reward already ${status}`,
          user,
        });
      }

      if (oldStatus === "pending") {
        user.pendingReferralRewards = Math.max(
          0,
          Number(user.pendingReferralRewards || 0) - amount
        );
      }

      if (oldStatus === "approved" && status !== "approved") {
        user.approvedReferralRewards = Math.max(
          0,
          Number(user.approvedReferralRewards || 0) - amount
        );

        user.wallets.EXALT = Math.max(
          0,
          Number(user.wallets.EXALT || 0) - amount
        );

        await Transaction.create({
          userId: user._id,
          type: "adjustment",
          amount,
          coin: "EXALT",
          status: "completed",
          note: `Referral reward approval reversed for ${reward.referredEmail || "referred user"}`,
          createdBy: req.user.id,
        });
      }

      reward.status = status;
      reward.note = note || reward.note || "";

      if (status === "pending") {
        user.pendingReferralRewards =
          Number(user.pendingReferralRewards || 0) + amount;

        reward.approvedAt = null;

        await createNotificationSafe({
          userId: user._id,
          title: "Referral Reward Pending",
          message: `${amount} EXALT referral reward has been moved back to pending review.`,
        });
      }

      if (oldStatus !== "approved" && status === "approved") {
        user.approvedReferralRewards =
          Number(user.approvedReferralRewards || 0) + amount;

        user.wallets.EXALT = Number(user.wallets.EXALT || 0) + amount;
        reward.approvedAt = new Date();

        await Transaction.create({
          userId: user._id,
          type: "reward",
          amount,
          coin: "EXALT",
          status: "completed",
          note: `Referral reward approved for ${reward.referredEmail || "referred user"}`,
          createdBy: req.user.id,
        });

        await createNotificationSafe({
          userId: user._id,
          title: "Referral Reward Approved",
          message: `${amount} EXALT referral reward has been approved and credited to your wallet.`,
        });
      }

      if (status === "rejected") {
        reward.approvedAt = null;

        await createNotificationSafe({
          userId: user._id,
          title: "Referral Reward Rejected",
          message: `${amount} EXALT referral reward was rejected. ${note || ""}`,
        });
      }

      await user.save();

      res.json({
        success: true,
        message: `Referral reward ${status} successfully`,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Reward status update failed",
        error: error.message,
      });
    }
  }
);

module.exports = router;