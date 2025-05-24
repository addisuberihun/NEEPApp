const mongoose = require("mongoose");

const quizScoreSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "students",
      required: true,
      index: true // Keep single index
    },
    subject: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    answers: {
      type: Map,
      of: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);


quizScoreSchema.indexes(); // Log existing indexes for verification

const QuizScoreModel = mongoose.model("QuizScore", quizScoreSchema);
module.exports = QuizScoreModel;
