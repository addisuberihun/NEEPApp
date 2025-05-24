const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['pdf_upload', 'announcement', 'grade', 'other'],
    default: 'other'
  },
  // Reference to the related item (like a PDF)
  relatedItem: {
    itemId: { 
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    itemType: { 
      type: String,
      required: false
    }
  },
  // For targeted notifications to specific students
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Students"
  }],
  // For class/subject-wide notifications
  subject: {
    type: String,
    required: false
  },
  // Track which students have read this notification
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Students"
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add a virtual property to check if a specific student has read this notification
notificationSchema.virtual('isReadByStudent').get(function() {
  return function(studentId) {
    return this.readBy.includes(studentId);
  };
});

module.exports = mongoose.model("Notification", notificationSchema);