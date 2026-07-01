const ExaltUtility = require("../models/ExaltUtility");

const defaultTools = [
  {
    name: "Position Size Calculator",
    slug: "position-size-calculator",
    category: "Risk",
    accessType: "Free",
    requiredExalt: 0,
    featured: true,
    description: "Calculate safe position size based on capital, risk percentage, entry and stop loss.",
  },
  {
    name: "Liquidation Calculator",
    slug: "liquidation-calculator",
    category: "Risk",
    accessType: "Free",
    requiredExalt: 0,
    featured: true,
    description: "Estimate liquidation zones using entry price, leverage and trade direction.",
  },
  {
    name: "Risk Reward Calculator",
    slug: "risk-reward-calculator",
    category: "Trading",
    accessType: "Free",
    requiredExalt: 0,
    featured: true,
    description: "Check reward-to-risk ratio before entering a trade.",
  },
  {
    name: "Funding Rate Watch",
    slug: "funding-rate-watch",
    category: "Market",
    accessType: "Premium",
    requiredExalt: 1000,
    featured: false,
    description: "Track funding pressure and premium futures market conditions.",
  },
  {
    name: "Volatility Meter",
    slug: "volatility-meter",
    category: "Market",
    accessType: "Premium",
    requiredExalt: 1000,
    featured: false,
    description: "Measure current volatility and market movement risk.",
  },
  {
    name: "EXALT Holder Boost",
    slug: "exalt-holder-boost",
    category: "EXALT",
    accessType: "EXALT Holder",
    requiredExalt: 2500,
    featured: true,
    description: "Unlock premium exchange benefits for EXALT holders.",
  },
];

const seedTools = async () => {
  for (const tool of defaultTools) {
    await ExaltUtility.findOneAndUpdate(
      { slug: tool.slug },
      tool,
      { upsert: true, new: true }
    );
  }
};

exports.getUtilityTools = async (req, res) => {
  try {
    await seedTools();

    const tools = await ExaltUtility.find().sort({
      featured: -1,
      category: 1,
      name: 1,
    });

    res.json({ success: true, tools });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load Exalt Utility tools",
      error: error.message,
    });
  }
};

exports.getUtilityStats = async (req, res) => {
  try {
    await seedTools();

    const tools = await ExaltUtility.find();

    res.json({
      success: true,
      stats: {
        total: tools.length,
        active: tools.filter((x) => x.status === "Active").length,
        premium: tools.filter((x) => x.accessType === "Premium").length,
        free: tools.filter((x) => x.accessType === "Free").length,
        exaltHolder: tools.filter((x) => x.accessType === "EXALT Holder").length,
        featured: tools.filter((x) => x.featured).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load Exalt Utility stats",
      error: error.message,
    });
  }
};

exports.createOrUpdateUtilityTool = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Tool name and slug are required" });
    }

    const tool = await ExaltUtility.findOneAndUpdate(
      { slug: String(slug).toLowerCase() },
      {
        ...req.body,
        slug: String(slug).toLowerCase(),
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Utility tool saved",
      tool,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save utility tool",
      error: error.message,
    });
  }
};

exports.updateUtilityStatus = async (req, res) => {
  try {
    const tool = await ExaltUtility.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status || "Active",
        featured: req.body.featured,
        adminNote: req.body.adminNote || "",
      },
      { new: true }
    );

    if (!tool) return res.status(404).json({ message: "Utility tool not found" });

    res.json({
      success: true,
      message: "Utility tool updated",
      tool,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update utility tool",
      error: error.message,
    });
  }
};

exports.deleteUtilityTool = async (req, res) => {
  try {
    const tool = await ExaltUtility.findById(req.params.id);

    if (!tool) return res.status(404).json({ message: "Utility tool not found" });

    await tool.deleteOne();

    res.json({
      success: true,
      message: "Utility tool deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete utility tool",
      error: error.message,
    });
  }
};