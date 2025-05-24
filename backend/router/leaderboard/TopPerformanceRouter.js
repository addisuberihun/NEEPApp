const express = require('express');
const router = express.Router();
const topPerformersController = require('../../controller/leaderboard/TopPerformanceController');

router.get('/', topPerformersController.getTopPerformers);

module.exports = router;