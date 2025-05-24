const addExamModel = require('../model/addExamModel');
const RecentActivity = require('../model/recentActivityModel');
const mongoose = require('mongoose');

exports.addQuize = async (req, res) => {
    try {
        const { subject, level, question, options, correctAnswer, explanation } = req.body;
        const userId = req.user?.userId;  // ✅ Extract user ID from token

        if (!subject || !question || !options || !correctAnswer || !userId) {
            return res.status(400).json({ message: 'Missing required fields or not authenticated' });
        }

        // Validate userId as a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const newQuestion = new addExamModel({
            subject,
            level: level || 1,
            question,
            options,
            correctAnswer,
            explanation: explanation || '',
            createdBy: userId               // ✅ Store creator ID
        });

        const savedQuestion = await newQuestion.save();

        // Save recent activity
        const activity = new RecentActivity({
            teacherId: new mongoose.Types.ObjectId(userId), // Correctly instantiate ObjectId
            activityType: 'exam_added',
            description: `Added a new exam question for ${subject} (Level ${level || 1})`,
            resourceId: savedQuestion._id,
        });

        await activity.save();

        res.status(201).json({
            success: true,
            message: "Question added successfully",
            data: savedQuestion
        });
    } catch (error) {
        console.error('Error adding question:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add question',
            error: error.message
        });
    }
};

exports.getQuize = async (req, res) => {
    try {
        const { subject, groupByLevel, level } = req.query;
        let query = {};

        if (subject) {
            query.subject = { $regex: new RegExp(`^${subject}$`, 'i') };
        }

        if (level) {
            query.level = parseInt(level, 10);
        }

        const questions = await addExamModel.find(query).sort({ level: 1 });

        if (groupByLevel === 'true') {
            const grouped = questions.reduce((acc, question) => {
                const levelKey = `level${question.level}`;
                if (!acc[levelKey]) {
                    acc[levelKey] = [];
                }
                acc[levelKey].push(question);
                return acc;
            }, {});

            return res.status(200).json({
                success: true,
                data: grouped,
                count: questions.length
            });
        }

        res.status(200).json({
            success: true,
            data: questions,
            count: questions.length
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch questions',
            error: error.message
        });
    }
};

