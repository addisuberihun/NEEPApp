
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ChatRoom = require('../model/chatRoomModel');
const PDF = require('../model/pdfModel');
const Exam = require('../model/addExamModel');
const Entrance = require('../model/addEntranceModel');
//const Tip = mongoose.model('Tip') || require('../model/addTipModel'); // Adjust if model name differs
const verifyToken = require('../middleware/authMiddleware');

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const stats = {
      chatrooms: await ChatRoom.countDocuments({ createdBy: new mongoose.Types.ObjectId(teacherId) }),
      pdfs: await PDF.countDocuments({ uploadedBy: new mongoose.Types.ObjectId(teacherId) }),
      quizzes: await Exam.countDocuments({ createdBy: teacherId }), // String comparison
      entranceExams: await Entrance.countDocuments({ createdBy: teacherId }), // String comparison
    //   tips: await Tip.countDocuments({ createdBy: new mongoose.Types.ObjectId(teacherId) })
    };
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

module.exports = router;
