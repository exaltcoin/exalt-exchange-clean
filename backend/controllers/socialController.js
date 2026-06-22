const SocialPost = require("../models/SocialPost");
const TraderProfile = require("../models/TraderProfile");

/* =========================
   CREATE POST
========================= */
exports.createPost = async (req, res) => {
  try {
    const { content, image, pair, tradeType, sentiment } = req.body;

    if (!content) return res.status(400).json({ message: "Post content is required" });

    const post = await SocialPost.create({
      trader: req.user._id,
      content,
      image: image || "",
      pair: pair || "BTC/USDT",
      tradeType: tradeType || "General",
      sentiment: sentiment || "Neutral",
    });

    res.status(201).json({ success: true, message: "Post created successfully", post });
  } catch (error) {
    res.status(500).json({ message: "Create post failed", error: error.message });
  }
};

/* =========================
   GET ALL POSTS
========================= */
exports.getPosts = async (req, res) => {
  try {
    const posts = await SocialPost.find()
      .populate("trader", "name email profileImage")
      .populate("likes", "name email")
      .populate("comments.user", "name email profileImage")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ message: "Get posts failed", error: error.message });
  }
};

/* =========================
   LIKE / UNLIKE POST
========================= */
exports.toggleLike = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: post.likes.length,
      message: alreadyLiked ? "Post unliked" : "Post liked",
    });
  } catch (error) {
    res.status(500).json({ message: "Like action failed", error: error.message });
  }
};

/* =========================
   ADD COMMENT
========================= */
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user._id, text });
    await post.save();

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comments: post.comments,
    });
  } catch (error) {
    res.status(500).json({ message: "Add comment failed", error: error.message });
  }
};

/* =========================
   DELETE POST USER / ADMIN
========================= */
exports.deletePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isOwner = post.trader.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed to delete this post" });
    }

    await post.deleteOne();

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete post failed", error: error.message });
  }
};

/* =========================
   CREATE / UPDATE TRADER PROFILE
========================= */
exports.upsertTraderProfile = async (req, res) => {
  try {
    const { displayName, bio, avatar } = req.body;

    const profile = await TraderProfile.findOneAndUpdate(
      { user: req.user._id },
      { displayName, bio, avatar },
      { new: true, upsert: true }
    ).populate("user", "name email profileImage");

    res.json({ success: true, message: "Trader profile saved successfully", profile });
  } catch (error) {
    res.status(500).json({ message: "Save trader profile failed", error: error.message });
  }
};

/* =========================
   GET MY TRADER PROFILE
========================= */
exports.getMyTraderProfile = async (req, res) => {
  try {
    let profile = await TraderProfile.findOne({ user: req.user._id })
      .populate("user", "name email profileImage")
      .populate("followers", "name email profileImage")
      .populate("following", "name email profileImage");

    if (!profile) {
      profile = await TraderProfile.create({
        user: req.user._id,
        displayName: req.user.name || "",
      });
    }

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ message: "Get trader profile failed", error: error.message });
  }
};

/* =========================
   GET TRADER PROFILE BY USER ID
========================= */
exports.getTraderProfile = async (req, res) => {
  try {
    const profile = await TraderProfile.findOne({ user: req.params.userId })
      .populate("user", "name email profileImage")
      .populate("followers", "name email profileImage")
      .populate("following", "name email profileImage");

    if (!profile) return res.status(404).json({ message: "Trader profile not found" });

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ message: "Get trader profile failed", error: error.message });
  }
};

/* =========================
   FOLLOW / UNFOLLOW TRADER
========================= */
exports.toggleFollowTrader = async (req, res) => {
  try {
    const traderUserId = req.params.userId;

    if (traderUserId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    let myProfile = await TraderProfile.findOne({ user: req.user._id });
    let traderProfile = await TraderProfile.findOne({ user: traderUserId });

    if (!myProfile) myProfile = await TraderProfile.create({ user: req.user._id });
    if (!traderProfile) traderProfile = await TraderProfile.create({ user: traderUserId });

    const alreadyFollowing = myProfile.following.some(
      (id) => id.toString() === traderUserId
    );

    if (alreadyFollowing) {
      myProfile.following = myProfile.following.filter(
        (id) => id.toString() !== traderUserId
      );
      traderProfile.followers = traderProfile.followers.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      myProfile.following.push(traderUserId);
      traderProfile.followers.push(req.user._id);
    }

    await myProfile.save();
    await traderProfile.save();

    res.json({
      success: true,
      following: !alreadyFollowing,
      message: alreadyFollowing ? "Trader unfollowed" : "Trader followed",
    });
  } catch (error) {
    res.status(500).json({ message: "Follow action failed", error: error.message });
  }
};

/* =========================
   TOP TRADERS
========================= */
exports.getTopTraders = async (req, res) => {
  try {
    const traders = await TraderProfile.find()
      .populate("user", "name email profileImage")
      .sort({ roi: -1, winRate: -1, profit: -1 })
      .limit(20);

    res.json({ success: true, traders });
  } catch (error) {
    res.status(500).json({ message: "Get top traders failed", error: error.message });
  }
};

/* =========================
   ADMIN: GET ALL SOCIAL STATS
========================= */
exports.getSocialStats = async (req, res) => {
  try {
    const totalPosts = await SocialPost.countDocuments();
    const totalTraders = await TraderProfile.countDocuments();
    const verifiedTraders = await TraderProfile.countDocuments({ verifiedTrader: true });

    const posts = await SocialPost.find();
    const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);

    res.json({
      success: true,
      stats: { totalPosts, totalTraders, verifiedTraders, totalLikes, totalComments },
    });
  } catch (error) {
    res.status(500).json({ message: "Get social stats failed", error: error.message });
  }
};

/* =========================
   ADMIN: GET ALL TRADERS
========================= */
exports.getAllTradersAdmin = async (req, res) => {
  try {
    const traders = await TraderProfile.find()
      .populate("user", "name email profileImage role")
      .populate("followers", "name email profileImage")
      .populate("following", "name email profileImage")
      .sort({ createdAt: -1 });

    res.json({ success: true, traders });
  } catch (error) {
    res.status(500).json({ message: "Get all traders failed", error: error.message });
  }
};

/* =========================
   ADMIN: VERIFY TRADER
========================= */
exports.verifyTrader = async (req, res) => {
  try {
    const profile = await TraderProfile.findByIdAndUpdate(
      req.params.id,
      { verifiedTrader: true },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: "Trader profile not found" });

    res.json({ success: true, message: "Trader verified successfully", profile });
  } catch (error) {
    res.status(500).json({ message: "Verify trader failed", error: error.message });
  }
};

/* =========================
   ADMIN: UNVERIFY TRADER
========================= */
exports.unverifyTrader = async (req, res) => {
  try {
    const profile = await TraderProfile.findByIdAndUpdate(
      req.params.id,
      { verifiedTrader: false },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: "Trader profile not found" });

    res.json({ success: true, message: "Trader unverified successfully", profile });
  } catch (error) {
    res.status(500).json({ message: "Unverify trader failed", error: error.message });
  }
};

/* =========================
   ADMIN: UPDATE TRADER STATS
========================= */
exports.updateTraderStats = async (req, res) => {
  try {
    const { totalTrades, winRate, roi, profit, riskLevel, rank, badges } = req.body;

    const profile = await TraderProfile.findByIdAndUpdate(
      req.params.id,
      { totalTrades, winRate, roi, profit, riskLevel, rank, badges },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: "Trader profile not found" });

    res.json({ success: true, message: "Trader stats updated successfully", profile });
  } catch (error) {
    res.status(500).json({ message: "Update trader stats failed", error: error.message });
  }
};

/* =========================
   ADMIN: DELETE ANY POST
========================= */
exports.adminDeletePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    await post.deleteOne();

    res.json({ success: true, message: "Admin deleted post successfully" });
  } catch (error) {
    res.status(500).json({ message: "Admin delete post failed", error: error.message });
  }
};