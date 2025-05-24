// controllers/studentProgressController.js
const StudentProgress = require('../../model/studentQuizProgressModel');
const Student = require('../../model/signupUserModel');

exports.getStudentProgress = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const progress = await StudentProgress.findOne({ studentId })
            .populate('studentId', 'name email');
            
        if (!progress) {
            // Return default progress with level 1 unlocked for all subjects
            return res.status(200).json({
                success: true,
                data: {
                    studentId,
                    subjectProgress: {},
                    lastUpdated: new Date()
                }
            });
        }
        
        res.status(200).json({
            success: true,
            data: progress
        });
        
    } catch (error) {
        console.error('Error fetching student progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student progress',
            error: error.message
        });
    }
};

exports.resetStudentProgress = async (req, res) => {
    try {
        const { studentId, subject } = req.body;
        
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }
        
        let update = {};
        if (subject) {
            // Reset specific subject
            update = { $set: { [`subjectProgress.${subject}`]: [1] } };
        } else {
            // Reset all subjects
            update = { $set: { subjectProgress: {} } };
        }
        
        await StudentProgress.findOneAndUpdate(
            { studentId },
            update,
            { upsert: true, new: true }
        );
        
        res.status(200).json({
            success: true,
            message: subject 
                ? `Progress reset for ${subject}` 
                : 'All progress reset'
        });
        
    } catch (error) {
        console.error('Error resetting progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset progress',
            error: error.message
        });
    }
};