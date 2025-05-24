const mongoose = require('mongoose');

const studyTipSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Subject Oriented', 'Study Skills', 'Exam Strategies'],
  },
  level: {
    type: String,
    required: [true, 'Level is required'],
    enum: ['Easy', 'Medium', 'Hard'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: [5, 'Title must be at least 5 characters long'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters long'],
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teachers',
    required: [true, 'Creator is required'],
  },
  likes: {
    type: Number,
    default: 0,
  },
  dislikes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'students',
  }],
  dislikedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'students',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('StudyTip', studyTipSchema);