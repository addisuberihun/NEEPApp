const RecentActivity = require('../model/recentActivityModel');
const mongoose = require('mongoose');

const getRecentActivities = async (req, res) => {
  try {
    const teacherId = new mongoose.Types.ObjectId(req.user.userId);
    console.log('Fetching activities for teacherId:', teacherId);

    const activities = await RecentActivity.aggregate([
      { $match: { teacherId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$activityType',
          activity: { $first: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: '$activity._id',
          activityType: '$activity.activityType',
          description: '$activity.description',
          createdAt: '$activity.createdAt',
          resourceId: '$activity.resourceId'
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    console.log('Fetched activities:', activities);
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Error fetching recent activities', error: error.message });
  }
};

module.exports = { getRecentActivities };