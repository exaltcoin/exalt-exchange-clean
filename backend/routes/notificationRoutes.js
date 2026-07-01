const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  getAllNotifications,
  deleteNotification,
} = require("../controllers/notificationController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* USER */
router.get("/me", protect, getMyNotifications);
router.put("/read/all", protect, markAllNotificationsRead);
router.put("/:id/read", protect, markNotificationRead);

/* ADMIN */
router.get("/admin/all", protect, adminOnly, getAllNotifications);
router.post("/admin/create", protect, adminOnly, createNotification);
router.delete("/admin/:id", protect, adminOnly, deleteNotification);

module.exports = router;