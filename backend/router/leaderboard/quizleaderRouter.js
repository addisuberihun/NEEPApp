// routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const quizleaderController = require('../../controller/leaderboard/quizLeaderController');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, quizleaderController.getLeaderboard);

module.exports = router;