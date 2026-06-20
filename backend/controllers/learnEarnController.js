const LearnEarn = require("../models/LearnEarn");
const UserWallet = require("../models/UserWallet");

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

    const record = await LearnEarn.create({
      userId,
      lessonId: lesson.lessonId,
      lessonTitle: lesson.lessonTitle,
      reward: lesson.reward,
      coin: "EXALT",
      status: "completed",
    });

    await UserWallet.findOneAndUpdate(
      { userId },
      {
        $inc: {
          "balances.EXALT": Number(lesson.reward),
          "totalDeposited.EXALT": Number(lesson.reward),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({
      success: true,
      message: `${lesson.reward} EXALT reward added successfully`,
      reward: lesson.reward,
      record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to complete lesson",
      error: error.message,
    });
  }
};