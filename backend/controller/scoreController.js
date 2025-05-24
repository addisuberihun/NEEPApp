const ScoreModel = require('../model/scoreModel');

const scoreController = async (req, res) => {
  try {
    const { student, year, score, totalQuestions, subject } = req.body;
    
    if (!student || !year || score === undefined || !totalQuestions || !subject) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newScore = new ScoreModel({
      student,
      year,
      score,
      totalQuestions,
      subject
    });

    await newScore.save();
    res.status(200).json({ message: "Score successfully saved" });
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).json({ message: "Failed to save score", error: error.message });
  }
};

module.exports = scoreController;