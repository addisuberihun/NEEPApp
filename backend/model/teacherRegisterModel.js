const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Changed from fullName to name
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String }, // Added phoneNumber (optional)
  subject: { type: String, required: true },
});

module.exports = mongoose.model('Teachers', TeacherSchema);