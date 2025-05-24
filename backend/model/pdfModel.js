const mongoose = require("mongoose")

const pdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  //filePath: { type: String, required: true }, // local path to the PDF file
  fileUrl: { type: String, required: true }, // URL to access the file
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teachers", // This matches exactly with the model name in teacherRegisterModel.js
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("PDF", pdfSchema)