const UserActivity = require('../model/userActivityModel');
const mongoose = require('mongoose');

// Record a new user activity
exports.recordActivity = async (req, res) => {
  try {
    const { activityType, resourceId, resourceType, metadata } = req.body;
    const userId = req.user.userId;
    const userType = req.user.role === 'teacher' ? 'Teachers' : 'students';

    if (!activityType || !resourceId || !resourceType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const activity = new UserActivity({
      userId: new mongoose.Types.ObjectId(userId),
      userModel: userType,
      activityType,
      resourceId: mongoose.Types.ObjectId.isValid(resourceId) ? 
        new mongoose.Types.ObjectId(resourceId) : resourceId,
      resourceType,
      metadata: metadata || {}
    });

    await activity.save();

    res.status(201).json({
      success: true,
      message: 'Activity recorded successfully',
      data: activity
    });
  } catch (error) {
    console.error('Error recording activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record activity',
      error: error.message
    });
  }
};

// Get the latest activities for a user
exports.getLatestActivities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.role === 'teacher' ? 'Teachers' : 'students';

    // Get the latest activity for each activity type
    const activities = await UserActivity.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          userModel: userType
        } 
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$activityType',
          activity: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$activity' }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching latest activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest activities',
      error: error.message
    });
  }
};