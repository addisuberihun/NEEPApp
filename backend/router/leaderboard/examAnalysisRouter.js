const express = require('express');
const router = express.Router();
const {
  getRecentExams,
  getTopScorersByYear,
  getOverallTopScorers,
  getSubjectActivitiesAndScores
} = require('../../controller/leaderboard/examAnalysisController');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/exams', authMiddleware, getRecentExams);
router.get('/top-scorers-year', authMiddleware, getTopScorersByYear);
router.get('/top-scorers-overall', authMiddleware, getOverallTopScorers);
router.get('/subject-data', authMiddleware, getSubjectActivitiesAndScores);

module.exports = router;