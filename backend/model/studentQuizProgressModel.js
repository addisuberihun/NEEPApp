const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'students',
    required: true,
    unique: true
  },
  subjectProgress: {
    type: Map,
    of: [Number], // Array of unlocked levels for each subject
    default: {}
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
studentProgressSchema.index({ studentId: 1 });

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);

module.exports = StudentProgress;