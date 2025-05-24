const express = require('express');
const router = express.Router();
const progressController = require('../../controller/leaderboard/quizprogressController');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/:studentId', authMiddleware, progressController.getStudentProgress);
router.post('/reset', authMiddleware, progressController.resetStudentProgress);

module.exports = router;