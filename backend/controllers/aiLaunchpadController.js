const AILaunchpad = require("../models/AILaunchpad");

const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

const calculateLaunchpad = ({ hardCap, softCap, raisedAmount, auditStatus, kycStatus }) => {
  hardCap = Number(hardCap || 0);
  softCap = Number(softCap || 0);
  raisedAmount = Number(raisedAmount || 0);

  const progress = hardCap > 0 ? (raisedAmount / hardCap) * 100 : 0;

  let aiScore = 70;
  let riskLevel = "Medium";

  if (auditStatus === "Passed") aiScore += 10;
  if (kycStatus === "Passed") aiScore += 10;
  if (raisedAmount >= softCap && softCap > 0) aiScore += 5;
  if (raisedAmount >= hardCap && hardCap > 0) aiScore += 5;

  aiScore = Math.min(aiScore, 100);

  if (aiScore >= 85) riskLevel = "Low";
  if (aiScore < 70) riskLevel = "High";

  return {
    progress: round(progress),
    aiScore,
    riskLevel,
  };
};

const seedData = async () => {
  const count = await AILaunchpad.countDocuments();
  if (count > 0) return;

  await AILaunchpad.insertMany([
    {
      projectName: "Exalt coin",
      symbol: "EXALT",
      chain: "BNB Chain",
      category: "Exchange",
      tokenPrice: 0.024,
      hardCap: 100000,
      softCap: 30000,
      raisedAmount: 42000,
      status: "Live",
      verified: true,
      featured: true,
      auditStatus: "Passed",
      kycStatus: "Passed",
      website: "https://exaltcoincommunity.com",
      telegram: "https://t.me/exaltcommunity",
      twitter: "https://x.com/exalt_coin",
      ...calculateLaunchpad({
        hardCap: 100000,
        softCap: 30000,
        raisedAmount: 42000,
        auditStatus: "Passed",
        kycStatus: "Passed",
      }),
    },
    {
      projectName: "AI Utility Token",
      symbol: "AIU",
      chain: "BNB Chain",
      category: "AI",
      tokenPrice: 0.01,
      hardCap: 80000,
      softCap: 25000,
      raisedAmount: 18000,
      status: "Upcoming",
      auditStatus: "Pending",
      kycStatus: "Pending",
      ...calculateLaunchpad({
        hardCap: 80000,
        softCap: 25000,
        raisedAmount: 18000,
        auditStatus: "Pending",
        kycStatus: "Pending",
      }),
    },
    {
      projectName: "DeFi Yield Protocol",
      symbol: "DYP",
      chain: "Polygon",
      category: "DeFi",
      tokenPrice: 0.04,
      hardCap: 150000,
      softCap: 50000,
      raisedAmount: 76000,
      status: "Live",
      auditStatus: "Passed",
      kycStatus: "Pending",
      ...calculateLaunchpad({
        hardCap: 150000,
        softCap: 50000,
        raisedAmount: 76000,
        auditStatus: "Passed",
        kycStatus: "Pending",
      }),
    },
  ]);
};

/* USER CREATE */
exports.createLaunchpadProject = async (req, res) => {
  try {
    const analysis = calculateLaunchpad(req.body);

    const project = await AILaunchpad.create({
      user: req.user._id,
      ...req.body,
      ...analysis,
    });

    res.status(201).json({
      success: true,
      message: "AI launchpad project created",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create launchpad project",
      error: error.message,
    });
  }
};

/* USER GET */
exports.getLaunchpadProjects = async (req, res) => {
  try {
    await seedData();

    const projects = await AILaunchpad.find().sort({
      featured: -1,
      status: 1,
      aiScore: -1,
      createdAt: -1,
    });

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load AI Launchpad",
      error: error.message,
    });
  }
};

/* FAVORITE */
exports.toggleFavoriteLaunchpad = async (req, res) => {
  try {
    const project = await AILaunchpad.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Launchpad project not found" });
    }

    project.isFavorite = !project.isFavorite;
    await project.save();

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ADMIN LIST */
exports.getAdminLaunchpadProjects = async (req, res) => {
  try {
    await seedData();

    const projects = await AILaunchpad.find()
      .populate("user", "name email role")
      .sort({ featured: -1, createdAt: -1 });

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ADMIN STATS */
exports.getLaunchpadStats = async (req, res) => {
  try {
    await seedData();

    const all = await AILaunchpad.find();

    res.json({
      success: true,
      stats: {
        total: all.length,
        live: all.filter((x) => x.status === "Live").length,
        upcoming: all.filter((x) => x.status === "Upcoming").length,
        ended: all.filter((x) => x.status === "Ended").length,
        verified: all.filter((x) => x.verified).length,
        featured: all.filter((x) => x.featured).length,
        lowRisk: all.filter((x) => x.riskLevel === "Low").length,
        mediumRisk: all.filter((x) => x.riskLevel === "Medium").length,
        highRisk: all.filter((x) => x.riskLevel === "High").length,
        totalRaised: round(all.reduce((sum, x) => sum + Number(x.raisedAmount || 0), 0)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ADMIN REVIEW */
exports.reviewLaunchpadProject = async (req, res) => {
  try {
    const {
      status,
      verified,
      featured,
      auditStatus,
      kycStatus,
      adminNote,
    } = req.body;

    const project = await AILaunchpad.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Launchpad project not found" });
    }

    if (status) project.status = status;
    if (typeof verified === "boolean") project.verified = verified;
    if (typeof featured === "boolean") project.featured = featured;
    if (auditStatus) project.auditStatus = auditStatus;
    if (kycStatus) project.kycStatus = kycStatus;
    if (adminNote !== undefined) project.adminNote = adminNote;

    const analysis = calculateLaunchpad(project);
    project.aiScore = analysis.aiScore;
    project.riskLevel = analysis.riskLevel;
    project.adminReviewed = true;

    await project.save();

    res.json({
      success: true,
      message: "Launchpad project reviewed",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to review launchpad project",
      error: error.message,
    });
  }
};

/* ADMIN DELETE */
exports.deleteLaunchpadProject = async (req, res) => {
  try {
    const project = await AILaunchpad.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Launchpad project not found" });
    }

    await project.deleteOne();

    res.json({
      success: true,
      message: "Launchpad project deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete launchpad project",
      error: error.message,
    });
  }
};