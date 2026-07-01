const LearnEarn = require("../models/LearnEarn");
const UserWallet = require("../models/UserWallet");
const WalletLedger = require("../models/WalletLedger");

const lessons = [
  { lessonId: 1, lessonTitle: "Crypto Basics", reward: 25 },
  { lessonId: 2, lessonTitle: "P2P Safety", reward: 40 },
  { lessonId: 3, lessonTitle: "Staking Guide", reward: 50 },
];

exports.getLearnEarnProgress = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const completed = await LearnEarn.find({ userId }).sort({ createdAt: -1 });

    const totalRewards = completed.reduce(
      (sum, item) => sum + Number(item.reward || 0),
      0
    );

    res.json({
      success: true,
      lessons,
      completed,
      completedCount: completed.length,
      totalRewards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load Learn & Earn progress",
      error: error.message,
    });
  }
};

exports.completeLesson = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { lessonId } = req.body;

    const lesson = lessons.find((item) => item.lessonId === Number(lessonId));

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const alreadyCompleted = await LearnEarn.findOne({
      userId,
      lessonId: lesson.lessonId,
    });

    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: "Lesson already completed",
      });
    }

    const wallet = await UserWallet.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true }
    );

    if (wallet.isFrozen) {
      return res.status(403).json({
        success: false,
        message: wallet.freezeReason || "User wallet is frozen",
      });
    }

    const coin = "EXALT";
    const reward = Number(lesson.reward);

    const balanceBefore = Number(wallet.balances?.[coin] || 0);
    const balanceAfter = balanceBefore + reward;

    wallet.balances[coin] = balanceAfter;
    wallet.totalDeposited[coin] =
      Number(wallet.totalDeposited?.[coin] || 0) + reward;

    await wallet.save();

    const record = await LearnEarn.create({
      userId,
      lessonId: lesson.lessonId,
      lessonTitle: lesson.lessonTitle,
      reward,
      coin,
      status: "completed",
    });

    await WalletLedger.create({
      userId,
      type: "BONUS",
      coin,
      amount: reward,
      balanceBefore,
      balanceAfter,
      referenceId: record._id,
      referenceModel: "Admin",
      status: "SUCCESS",
      note: `Learn & Earn reward: ${lesson.lessonTitle}`,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: `${reward} EXALT reward added successfully`,
      reward,
      record,
      wallet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to complete lesson",
      error: error.message,
    });
  }
};