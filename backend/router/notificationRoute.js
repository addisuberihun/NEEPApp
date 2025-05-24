const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const authMiddleware = require("../middleware/authMiddleware"); // Adjust path as needed

// Get notifications for the current user
router.get("/", authMiddleware, notificationController.getMyNotifications);

// Mark a notification as read
router.patch("/:notificationId/read", authMiddleware, notificationController.markAsRead);

// Mark all notifications as read
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);

module.exports = router;