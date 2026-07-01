const Achievement = require("../models/Achievement");

const DEFAULT_ACHIEVEMENTS = [
  {
    key: "first_login",
    title: "First Login",
    description: "Welcome to Exalt Exchange.",
    category: "Community",
    tier: "Bronze",
    xp: 10,
    icon: "🚀",
  },
  {
    key: "kyc_verified",
    title: "KYC Verified",
    description: "Complete identity verification.",
    category: "KYC",
    tier: "Silver",
    xp: 50,
    icon: "🛡️",
  },
  {
    key: "first_trade",
    title: "First Trade",
    description: "Complete your first trade.",
    category: "Trading",
    tier: "Bronze",
    xp: 25,
    icon: "📈",
  },
  {
    key: "active_trader",
    title: "Active Trader",
    description: "Complete 50 trades.",
    category: "Trading",
    tier: "Gold",
    xp: 150,
    icon: "🔥",
  },
  {
    key: "p2p_expert",
    title: "P2P Expert",
    description: "Complete 20 P2P orders.",
    category: "P2P",
    tier: "Gold",
    xp: 150,
    icon: "🤝",
  },
  {
    key: "top_referrer",
    title: "Top Referrer",
    description: "Invite 10 users.",
    category: "Referral",
    tier: "Silver",
    xp: 100,
    icon: "👥",
  },
  {
    key: "staking_master",
    title: "Staking Master",
    description: "Stake EXALT for 30 days.",
    category: "Staking",
    tier: "Gold",
    xp: 150,
    icon: "💎",
  },
  {
    key: "launchpad_investor",
    title: "Launchpad Investor",
    description: "Join your first launchpad project.",
    category: "Launchpad",
    tier: "Platinum",
    xp: 250,
    icon: "🏆",
  },
];

const calculateLevel = (xp) => {
  if (xp >= 1000) return 10;
  if (xp >= 750) return 8;
  if (xp >= 500) return 6;
  if (xp >= 250) return 4;
  if (xp >= 100) return 2;
  return 1;
};

const buildDefaultProfile = (userId) => ({
  user: userId,
  achievements: DEFAULT_ACHIEVEMENTS.map((item) => ({
    ...item,
    unlocked: item.key === "first_login",
    unlockedAt: item.key === "first_login" ? new Date() : null,
  })),
  totalXP: 10,
  level: 1,
});

const recalculateProfile = (profile) => {
  let xp = 0;

  profile.achievements = profile.achievements.map((achievement) => {
    const raw = achievement.toObject?.() || achievement;
    let unlocked = Boolean(raw.unlocked);

    if (raw.key === "kyc_verified" && profile.stats.kycApproved) unlocked = true;
    if (raw.key === "first_trade" && profile.stats.totalTrades >= 1) unlocked = true;
    if (raw.key === "active_trader" && profile.stats.totalTrades >= 50) unlocked = true;
    if (raw.key === "p2p_expert" && profile.stats.p2pOrders >= 20) unlocked = true;
    if (raw.key === "top_referrer" && profile.stats.totalReferrals >= 10) unlocked = true;
    if (raw.key === "staking_master" && profile.stats.stakingDays >= 30) unlocked = true;
    if (raw.key === "launchpad_investor" && profile.stats.launchpadInvestments >= 1) unlocked = true;

    const unlockedAt = unlocked && !raw.unlockedAt ? new Date() : raw.unlockedAt;

    if (unlocked) xp += Number(raw.xp || 0);

    return {
      ...raw,
      unlocked,
      unlockedAt,
    };
  });

  profile.totalXP = xp;
  profile.level = calculateLevel(xp);
  profile.lastCheckedAt = new Date();

  return profile;
};

exports.getMyAchievements = async (req, res) => {
  try {
    let profile = await Achievement.findOne({ user: req.user._id }).populate(
      "user",
      "name email"
    );

    if (!profile) {
      profile = await Achievement.create(buildDefaultProfile(req.user._id));
      profile = await Achievement.findById(profile._id).populate(
        "user",
        "name email"
      );
    }

    profile = recalculateProfile(profile);
    await profile.save();

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load achievements",
      error: error.message,
    });
  }
};

exports.refreshAchievements = async (req, res) => {
  try {
    let profile = await Achievement.findOne({ user: req.user._id });

    if (!profile) {
      profile = await Achievement.create(buildDefaultProfile(req.user._id));
    }

    profile = recalculateProfile(profile);
    await profile.save();

    res.json({
      success: true,
      message: "Achievements refreshed",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to refresh achievements",
      error: error.message,
    });
  }
};

exports.getAllAchievements = async (req, res) => {
  try {
    const profiles = await Achievement.find()
      .populate("user", "name email role")
      .sort({ totalXP: -1, updatedAt: -1 })
      .limit(300);

    res.json({
      success: true,
      profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load achievement profiles",
      error: error.message,
    });
  }
};

exports.getSingleAchievement = async (req, res) => {
  try {
    const profile = await Achievement.findById(req.params.id).populate(
      "user",
      "name email role"
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Achievement profile not found",
      });
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load achievement profile",
      error: error.message,
    });
  }
};

exports.updateAchievementStats = async (req, res) => {
  try {
    const profile = await Achievement.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Achievement profile not found",
      });
    }

    profile.stats = {
      ...profile.stats,
      ...(req.body.stats || {}),
    };

    if (req.body.adminNote !== undefined) {
      profile.adminNote = req.body.adminNote;
    }

    recalculateProfile(profile);
    await profile.save();

    const populated = await Achievement.findById(profile._id).populate(
      "user",
      "name email role"
    );

    res.json({
      success: true,
      message: "Achievement profile updated",
      profile: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update achievement profile",
      error: error.message,
    });
  }
};