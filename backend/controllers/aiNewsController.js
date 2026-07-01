const AINews = require("../models/AINews");

const clamp = (value, min = 0, max = 100) => {
  return Math.min(Math.max(Number(value || 0), min), max);
};

const analyzeNews = ({ title = "", summary = "", category = "Market" }) => {
  const text = `${title} ${summary}`.toLowerCase();

  let sentiment = "Neutral";
  let marketImpact = "Medium";
  let aiConfidence = 78;

  const bullishWords = [
    "bullish",
    "surge",
    "rally",
    "growth",
    "approved",
    "partnership",
    "adoption",
    "breakout",
    "record",
    "increase",
    "positive",
  ];

  const bearishWords = [
    "bearish",
    "crash",
    "hack",
    "lawsuit",
    "ban",
    "decline",
    "drop",
    "exploit",
    "fraud",
    "warning",
    "negative",
  ];

  const highImpactWords = [
    "sec",
    "etf",
    "federal",
    "binance",
    "coinbase",
    "hack",
    "regulation",
    "lawsuit",
    "listing",
    "delisting",
    "exploit",
  ];

  const bullishScore = bullishWords.filter((word) => text.includes(word)).length;
  const bearishScore = bearishWords.filter((word) => text.includes(word)).length;
  const impactScore = highImpactWords.filter((word) => text.includes(word)).length;

  if (bullishScore > bearishScore) sentiment = "Bullish";
  if (bearishScore > bullishScore) sentiment = "Bearish";

  if (impactScore >= 2) marketImpact = "High";
  else if (impactScore === 1) marketImpact = "Medium";
  else marketImpact = "Low";

  aiConfidence = clamp(
    70 + bullishScore * 5 + bearishScore * 5 + impactScore * 4,
    55,
    97
  );

  const tags = [
    category,
    sentiment,
    marketImpact,
  ].filter(Boolean);

  return {
    sentiment,
    marketImpact,
    aiConfidence,
    tags,
  };
};

const seedNews = async () => {
  const count = await AINews.countDocuments();

  if (count > 0) return;

  await AINews.insertMany([
    {
      title: "Bitcoin market remains active as traders watch key resistance",
      summary:
        "AI analysis shows Bitcoin traders are watching resistance and liquidity zones before the next major move.",
      source: "Exalt AI News",
      category: "Bitcoin",
      sentiment: "Neutral",
      marketImpact: "Medium",
      aiConfidence: 82,
      affectedCoins: ["BTC"],
      tags: ["Bitcoin", "Liquidity", "Market"],
      isBreaking: false,
      isPinned: true,
    },
    {
      title: "Exchange activity increases across major crypto markets",
      summary:
        "Trading activity has increased across spot and futures markets, suggesting stronger participation from retail and institutional traders.",
      source: "Exalt AI News",
      category: "Exchange",
      sentiment: "Bullish",
      marketImpact: "Medium",
      aiConfidence: 85,
      affectedCoins: ["BTC", "ETH", "BNB"],
      tags: ["Exchange", "Volume", "Trading"],
      isBreaking: false,
    },
    {
      title: "Security alerts remain important after recent crypto exploits",
      summary:
        "AI risk systems recommend users enable stronger security settings and avoid suspicious wallet links.",
      source: "Exalt AI News",
      category: "Security",
      sentiment: "Bearish",
      marketImpact: "High",
      aiConfidence: 88,
      affectedCoins: ["Market"],
      tags: ["Security", "Risk", "Wallet"],
      isBreaking: true,
    },
  ]);
};

/* USER: GET NEWS */
exports.getNews = async (req, res) => {
  try {
    await seedNews();

    const { category, sentiment, impact, search } = req.query;

    const query = { status: { $in: ["Published", "Reviewed"] } };

    if (category && category !== "all") query.category = category;
    if (sentiment && sentiment !== "all") query.sentiment = sentiment;
    if (impact && impact !== "all") query.marketImpact = impact;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
        { affectedCoins: { $regex: search, $options: "i" } },
      ];
    }

    const news = await AINews.find(query)
      .sort({ isPinned: -1, isBreaking: -1, createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      news,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get AI news",
      error: error.message,
    });
  }
};

/* USER: CREATE NEWS / SUBMIT NEWS */
exports.createNews = async (req, res) => {
  try {
    const {
      title,
      summary,
      source,
      sourceUrl,
      category,
      affectedCoins,
    } = req.body;

    if (!title || !summary) {
      return res.status(400).json({
        message: "Title and summary are required",
      });
    }

    const analysis = analyzeNews({ title, summary, category });

    const news = await AINews.create({
      user: req.user?._id || null,
      title,
      summary,
      source: source || "Community News",
      sourceUrl: sourceUrl || "",
      category: category || "Market",
      affectedCoins: affectedCoins || [],
      ...analysis,
      status: "Published",
    });

    res.status(201).json({
      success: true,
      message: "AI news created",
      news,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create AI news",
      error: error.message,
    });
  }
};

/* USER: LIKE NEWS */
exports.toggleLikeNews = async (req, res) => {
  try {
    const news = await AINews.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    const userId = req.user._id.toString();

    const liked = news.likes.some((id) => id.toString() === userId);
    const disliked = news.dislikes.some((id) => id.toString() === userId);

    if (liked) {
      news.likes = news.likes.filter((id) => id.toString() !== userId);
    } else {
      news.likes.push(req.user._id);
    }

    if (disliked) {
      news.dislikes = news.dislikes.filter((id) => id.toString() !== userId);
    }

    await news.save();

    res.json({
      success: true,
      liked: !liked,
      likesCount: news.likes.length,
      dislikesCount: news.dislikes.length,
      news,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to like news",
      error: error.message,
    });
  }
};

/* USER: DISLIKE NEWS */
exports.toggleDislikeNews = async (req, res) => {
  try {
    const news = await AINews.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    const userId = req.user._id.toString();

    const disliked = news.dislikes.some((id) => id.toString() === userId);
    const liked = news.likes.some((id) => id.toString() === userId);

    if (disliked) {
      news.dislikes = news.dislikes.filter((id) => id.toString() !== userId);
    } else {
      news.dislikes.push(req.user._id);
    }

    if (liked) {
      news.likes = news.likes.filter((id) => id.toString() !== userId);
    }

    await news.save();

    res.json({
      success: true,
      disliked: !disliked,
      likesCount: news.likes.length,
      dislikesCount: news.dislikes.length,
      news,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to dislike news",
      error: error.message,
    });
  }
};

/* USER: BOOKMARK NEWS */
exports.toggleBookmarkNews = async (req, res) => {
  try {
    const news = await AINews.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    const userId = req.user._id.toString();
    const bookmarked = news.bookmarks.some((id) => id.toString() === userId);

    if (bookmarked) {
      news.bookmarks = news.bookmarks.filter((id) => id.toString() !== userId);
    } else {
      news.bookmarks.push(req.user._id);
    }

    await news.save();

    res.json({
      success: true,
      bookmarked: !bookmarked,
      bookmarksCount: news.bookmarks.length,
      news,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to bookmark news",
      error: error.message,
    });
  }
};

/* ADMIN: GET ALL NEWS */
exports.getAllNewsAdmin = async (req, res) => {
  try {
    await seedNews();

    const news = await AINews.find()
      .populate("user", "name email role")
      .sort({ isPinned: -1, isBreaking: -1, createdAt: -1 });

    res.json({
      success: true,
      news,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get admin AI news",
      error: error.message,
    });
  }
};

/* ADMIN: STATS */
exports.getNewsStatsAdmin = async (req, res) => {
  try {
    await seedNews();

    const news = await AINews.find();

    const total = news.length;
    const bullish = news.filter((item) => item.sentiment === "Bullish").length;
    const bearish = news.filter((item) => item.sentiment === "Bearish").length;
    const neutral = news.filter((item) => item.sentiment === "Neutral").length;
    const highImpact = news.filter((item) => item.marketImpact === "High").length;
    const breaking = news.filter((item) => item.isBreaking).length;
    const pinned = news.filter((item) => item.isPinned).length;
    const reviewed = news.filter((item) => item.adminReviewed).length;

    res.json({
      success: true,
      stats: {
        total,
        bullish,
        bearish,
        neutral,
        highImpact,
        breaking,
        pinned,
        reviewed,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get AI news stats",
      error: error.message,
    });
  }
};

/* ADMIN: REVIEW / UPDATE NEWS */
exports.reviewNewsAdmin = async (req, res) => {
  try {
    const {
      status,
      adminNote,
      isPinned,
      isBreaking,
      category,
      sentiment,
      marketImpact,
    } = req.body;

    const news = await AINews.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    news.status = status || news.status;
    news.adminNote = adminNote || "";
    news.adminReviewed = true;

    if (typeof isPinned === "boolean") news.isPinned = isPinned;
    if (typeof isBreaking === "boolean") news.isBreaking = isBreaking;
    if (category) news.category = category;
    if (sentiment) news.sentiment = sentiment;
    if (marketImpact) news.marketImpact = marketImpact;

    await news.save();

    const populated = await AINews.findById(news._id).populate(
      "user",
      "name email role"
    );

    res.json({
      success: true,
      message: "AI news reviewed",
      news: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to review AI news",
      error: error.message,
    });
  }
};

/* ADMIN: DELETE NEWS */
exports.deleteNewsAdmin = async (req, res) => {
  try {
    const news = await AINews.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    await news.deleteOne();

    res.json({
      success: true,
      message: "AI news deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete AI news",
      error: error.message,
    });
  }
};