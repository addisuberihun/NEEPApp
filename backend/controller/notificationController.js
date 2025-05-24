const Notification =require("../model/notificationModel");
const jwt = require("jsonwebtoken");

// Get notifications for the current user
exports.getMyNotifications = async (req, res) => {
  try {
    // Extract user ID from JWT token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, "yourSecretKey");
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = decodedToken.userId;
    const userRole = decodedToken.role;
    
    let query = {};
    
    if (userRole === "student") {
      // For students: get notifications that are either:
      // 1. Specifically for this student (in recipients array)
      // 2. General notifications with no specific recipients
      query = {
        $or: [
          { recipients: { $in: [userId] } },
          { recipients: { $size: 0 } }
        ]
      };
    } else {
      // For teachers or other roles, just return notifications relevant to them
      // This could be customized based on your requirements
      query = { createdBy: userId };
    }

    // Get notifications, sorted by most recent first
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Limit to most recent 50 notifications
    
    // Add a custom isRead field for this specific student
    const notificationsWithReadStatus = notifications.map(notification => {
      const notificationObj = notification.toObject();
      notificationObj.isRead = notification.readBy.includes(userId);
      return notificationObj;
    });
    
    res.status(200).json(notificationsWithReadStatus);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

// Mark notification as read for the current student
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // Extract user ID from JWT token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, "yourSecretKey");
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = decodedToken.userId;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Only add to readBy if not already there
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }
    
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error updating notification", error: error.message });
  }
};

// Mark all notifications as read for the current student
exports.markAllAsRead = async (req, res) => {
  try {
    // Extract user ID from JWT token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, "yourSecretKey");
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = decodedToken.userId;
    
    // Find all notifications for this user
    const notifications = await Notification.find({
      $or: [
        { recipients: { $in: [userId] } },
        { recipients: { $size: 0 } }
      ],
      readBy: { $ne: userId } // Only get notifications not already read by this user
    });
    
    // Add user to readBy for each notification
    const updatePromises = notifications.map(notification => {
      notification.readBy.push(userId);
      return notification.save();
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Error updating notifications", error: error.message });
  }
};