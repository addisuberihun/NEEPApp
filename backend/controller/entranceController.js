const EntranceModel = require("../model/addEntranceModel");
const RecentActivity = require("../model/recentActivityModel");
const mongoose = require("mongoose");

exports.createEntrance = async (req, res) => {
  try {
    console.log("Incoming body:", req.body);
    console.log("Incoming files:", req.files);

    const teacherSubject = req.user.subject;
    const teacherId = req.user.userId;

    // Validate teacherId
    if (!mongoose.isValidObjectId(teacherId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const { questionText, correctAnswer, year, grade } = req.body;

    // Validate grade
    if (!['9', '10', '11', '12'].includes(grade)) {
      return res.status(400).json({ message: "Invalid grade. Must be 9, 10, 11, or 12" });
    }

    const options = [];
    for (let i = 0; i < 4; i++) {
      const text = req.body[`optionText${i}`] || "";
      const imageFile = req.files?.[`optionImage${i}`];
      const image = imageFile ? imageFile[0].path : null;
      options.push({ text, image });
    }

    const questionImageFile = req.files?.questionImage;
    const questionImage = questionImageFile ? questionImageFile[0].path : null;

    const newEntrance = new EntranceModel({
      question: {
        text: questionText,
        image: questionImage,
      },
      options,
      correctAnswer,
      year,
      subject: teacherSubject,
      createdBy: teacherId,
      grade,
    });

    const savedEntrance = await newEntrance.save();

    // Save recent activity
    try {
      const activity = new RecentActivity({
        teacherId: new mongoose.Types.ObjectId(teacherId),
        activityType: "quiz_added",
        description: `Added a new entrance question for ${teacherSubject} (Grade ${grade}, Year ${year})`,
        resourceId: savedEntrance._id,
      });
      
      await activity.save();
      console.log("Recent activity logged for entrance question");
    } catch (activityError) {
      console.error("Error logging recent activity:", activityError);
    }

    res.status(200).json({ message: "Successfully added the exam question" });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ message: "Failed to add the question" });
  }
};

exports.getEntrance = async (req, res) => {
  try {
    const { subject, year } = req.params;
    const exams = await EntranceModel.find({ subject, year });
    res.json(exams);
  } catch (error) {
    console.error("Error retrieving exams:", error);
    res.status(500).json({ error: "Error retrieving exams" });
  }
};

