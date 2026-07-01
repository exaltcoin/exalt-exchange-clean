const Notification = require("../models/Notification");

/* USER: GET MY NOTIFICATIONS */
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { user: req.user._id },
        { isGlobal: true },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await Notification.countDocuments({
      $or: [
        { user: req.user._id },
        { isGlobal: true },
      ],
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load notifications",
      error: error.message,
    });
  }
};

/* USER: MARK SINGLE NOTIFICATION READ */
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { user: req.user._id },
          { isGlobal: true },
        ],
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Read notification:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark notification read",
      error: error.message,
    });
  }
};

/* USER: MARK ALL READ */
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { user: req.user._id },
          { isGlobal: true },
        ],
      },
      {
        isRead: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Read all notifications:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications read",
      error: error.message,
    });
  }
};

/* ADMIN: CREATE NOTIFICATION */
exports.createNotification = async (req, res) => {
  try {
    const {
      user,
      title,
      message,
      type,
      priority,
      isGlobal,
      actionUrl,
      metadata,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const notification = await Notification.create({
      user: isGlobal ? null : (user || null),
      title: title.trim(),
      message: message.trim(),
      type: type || "System",
      priority: priority || "Normal",
      isGlobal: Boolean(isGlobal),
      actionUrl: actionUrl || "",
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Create notification:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
};

/* ADMIN: GET ALL NOTIFICATIONS */
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Admin notifications:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load notifications",
      error: error.message,
    });
  }
};

/* ADMIN: DELETE NOTIFICATION */
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};