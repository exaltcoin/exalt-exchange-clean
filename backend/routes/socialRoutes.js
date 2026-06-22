const express = require("express");
const router = express.Router();

const {
  createPost,
  getPosts,
  toggleLike,
  addComment,
  deletePost,
  upsertTraderProfile,
  getMyTraderProfile,
  getTraderProfile,
  toggleFollowTrader,
  getTopTraders,
  getSocialStats,
  verifyTrader,
  updateTraderStats,
  getAllTradersAdmin,
  unverifyTrader,
  adminDeletePost,
} = require("../controllers/socialController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* USER ROUTES */
router.post("/posts", protect, createPost);
router.get("/posts", protect, getPosts);
router.put("/posts/:id/like", protect, toggleLike);
router.post("/posts/:id/comments", protect, addComment);
router.delete("/posts/:id", protect, deletePost);

router.post("/profile", protect, upsertTraderProfile);
router.get("/profile/me", protect, getMyTraderProfile);
router.get("/profile/:userId", protect, getTraderProfile);

router.put("/follow/:userId", protect, toggleFollowTrader);

router.get("/top-traders", protect, getTopTraders);

/* ADMIN ROUTES */
router.get("/admin/stats", protect, adminOnly, getSocialStats);
router.get("/admin/traders", protect, adminOnly, getAllTradersAdmin);
router.put("/admin/traders/:id/verify", protect, adminOnly, verifyTrader);
router.put("/admin/traders/:id/unverify", protect, adminOnly, unverifyTrader);
router.put("/admin/traders/:id/stats", protect, adminOnly, updateTraderStats);
router.delete("/admin/posts/:id", protect, adminOnly, adminDeletePost);

module.exports = router;