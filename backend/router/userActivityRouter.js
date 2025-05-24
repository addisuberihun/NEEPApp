const express = require('express');
const router = express.Router();
const userActivityController = require('../controller/userActivityController');
const verifyToken = require('../middleware/authMiddleware');

// Record a new user activity
router.post('/', verifyToken, userActivityController.recordActivity);

// Get the latest activities for a user
router.get('/latest', verifyToken, userActivityController.getLatestActivities);

module.exports = router;