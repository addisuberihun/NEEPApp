const mongoose = require('mongoose');

const recentActivitySchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teachers',
    required: true
  },
  activityType: {
    type: String,
    enum: ['note_added', 'note_updated', 'note_deleted', 'pdf_added', 'quiz_added', 'exam_added', 'chatroom_created', 'tip_added'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('RecentActivity', recentActivitySchema);
