const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name must be filled']
    },
    email: {
        type: String,
        required: [true, 'Email must be filled'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password must be filled']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number must be filled'],
        match: /^\+251\d{9}$/ // Ensures 12 digits, starting with '+251' followed by 9 digits
    },
    stream: {
        type: String,
        enum: ['Natural', 'Social'],
        required: [true, 'Stream must be selected']
    },
    yourGoal: {
        type: Number,
        required: [true, 'Goal must be filled']
    },
    role: {
        type: String,
        enum: ['student', 'super_admin'],
        default: 'student'
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
}, { timestamps: true }); // Enable createdAt and updatedAt

const StudentModel = mongoose.model('students', studentSchema);
module.exports = StudentModel;