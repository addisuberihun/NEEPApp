const express = require('express');
const router = express.Router();
const recentActivityController = require('../controller/recentActivityController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, recentActivityController.getRecentActivities);

module.exports = router;