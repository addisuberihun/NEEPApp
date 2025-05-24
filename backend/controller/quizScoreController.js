const QuizScore = require('../model/quizScoreModel');
const StudentProgress = require('../model/studentQuizProgressModel');

exports.saveQuizScore = async (req, res) => {
    try {
        const { studentId, subject, level, score, totalQuestions, percentage, answers } = req.body;

        // Validate required fields
        if (!studentId || !subject || !level || score === undefined || totalQuestions === undefined || percentage === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Save the quiz score
        const newScore = new QuizScore({
            studentId,
            subject,
            level,
            score,
            totalQuestions,
            percentage,
            answers
        });

        const savedScore = await newScore.save();

        // Unlock next level if score is ≥70% and not the last level
        if (percentage >= 70 && level < 5) {
            await StudentProgress.findOneAndUpdate(
                { studentId },
                { 
                    $addToSet: { [`subjectProgress.${subject}`]: level + 1 }
                },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({
            success: true,
            data: savedScore,
            message: 'Quiz score saved successfully'
        });

    } catch (error) {
        console.error('Error saving quiz score:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save quiz score',
            error: error.message
        });
    }
};

exports.getQuizScores = async (req, res) => {
    try {
        const { studentId, subject, level } = req.query;
        const query = {};
        
        if (studentId) query.studentId = studentId;
        if (subject) query.subject = subject;
        if (level) query.level = level;

        const scores = await QuizScore.find(query)
            .sort({ createdAt: -1 })
            .populate('studentId', 'name email');

        res.status(200).json({
            success: true,
            count: scores.length,
            data: scores
        });

    } catch (error) {
        console.error('Error fetching quiz scores:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz scores',
            error: error.message
        });
    }
};

exports.getStudentAnalytics = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Get all scores for the student
        const scores = await QuizScore.find({ studentId });

        // Calculate analytics
        const analytics = {
            totalQuizzes: scores.length,
            subjects: {},
            overallPercentage: 0,
            levelsCompleted: 0
        };

        let totalCorrect = 0;
        let totalQuestions = 0;

        scores.forEach(score => {
            // Subject-wise analytics
            if (!analytics.subjects[score.subject]) {
                analytics.subjects[score.subject] = {
                    attempts: 0,
                    totalScore: 0,
                    totalQuestions: 0,
                    levels: new Set()
                };
            }

            analytics.subjects[score.subject].attempts++;
            analytics.subjects[score.subject].totalScore += score.score;
            analytics.subjects[score.subject].totalQuestions += score.totalQuestions;
            analytics.subjects[score.subject].levels.add(score.level);

            // Overall totals
            totalCorrect += score.score;
            totalQuestions += score.totalQuestions;
        });

        // Calculate percentages
        analytics.overallPercentage = totalQuestions > 0 
            ? (totalCorrect / totalQuestions) * 100 
            : 0;

        // Convert Sets to arrays for response
        for (const subject in analytics.subjects) {
            analytics.subjects[subject].levels = [...analytics.subjects[subject].levels];
            analytics.subjects[subject].averagePercentage = 
                (analytics.subjects[subject].totalScore / analytics.subjects[subject].totalQuestions) * 100;
        }

        // Count unique level-subject combinations
        analytics.levelsCompleted = scores.reduce((acc, score) => {
            return acc.add(`${score.subject}-${score.level}`);
        }, new Set()).size;

        res.status(200).json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Error fetching student analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student analytics',
            error: error.message
        });
    }
};
