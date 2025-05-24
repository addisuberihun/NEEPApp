const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    enum: ['students', 'Teachers'],
    required: true
  },
  activityType: {
    type: String,
    enum: ['course_accessed', 'exam_accessed', 'quiz_accessed', 'pdf_viewed', 'note_viewed', 'chatroom_joined'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  resourceType: {
    type: String,
    enum: ['course', 'entrance_exam', 'quiz', 'pdf', 'note', 'chatroom'],
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

// Index for faster queries
userActivitySchema.index({ userId: 1, activityType: 1, createdAt: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);