const express = require("express")
const quizScoreController = require("../controller/quizScoreController")
const router = express.Router()

// Save quiz score
router.post("/", quizScoreController.saveQuizScore)

// Get quiz scores with filtering
router.get("/", quizScoreController.getQuizScores)

// Get analytics for a specific student
router.get("/analytics/:studentId", quizScoreController.getStudentAnalytics)

module.exports = router
