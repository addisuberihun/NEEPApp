const mongoose = require("mongoose");

const pdfDownloadSchema = new mongoose.Schema({
  pdfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PDF",
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Students", // Adjust this to match your student model name if different
    required: true
  },
  downloadedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to ensure a student can only have one download record per PDF
pdfDownloadSchema.index({ pdfId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("PDFDownload", pdfDownloadSchema);