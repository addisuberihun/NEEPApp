const StudentProgress = require('../model/studentQuizProgressModel');

// Unlock a new level for a student
exports.unlockLevel = async (req, res) => {
    try {
        const { studentId, subject, level } = req.body;
        
        await StudentProgress.findOneAndUpdate(
            { studentId },
            { $addToSet: { [`subjectProgress.${subject}`]: level } },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Failed to unlock level', error: error.message });
    }
};

// Get unlocked levels
exports.getProgress = async (req, res) => {
    try {
        const { studentId } = req.params;
        const progress = await StudentProgress.findOne({ studentId });
        res.status(200).json(progress?.subjectProgress || {});
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch progress', error: error.message });
    }
};