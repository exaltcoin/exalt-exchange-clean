const express = require("express");
const router = express.Router();

const {
  getNews,
  createNews,
  toggleLikeNews,
  toggleDislikeNews,
  toggleBookmarkNews,
  getAllNewsAdmin,
  getNewsStatsAdmin,
  reviewNewsAdmin,
  deleteNewsAdmin,
} = require("../controllers/aiNewsController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* ADMIN ROUTES */
router.get("/admin/stats", protect, adminOnly, getNewsStatsAdmin);
router.get("/admin/news", protect, adminOnly, getAllNewsAdmin);
router.put("/admin/news/:id/review", protect, adminOnly, reviewNewsAdmin);
router.delete("/admin/news/:id", protect, adminOnly, deleteNewsAdmin);

/* USER ROUTES */
router.get("/", protect, getNews);
router.post("/", protect, createNews);
router.put("/:id/like", protect, toggleLikeNews);
router.put("/:id/dislike", protect, toggleDislikeNews);
router.put("/:id/bookmark", protect, toggleBookmarkNews);

module.exports = router;