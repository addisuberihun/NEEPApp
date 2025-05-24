const RecentActivity = require('../../model/recentActivityModel');
const Score = require('../../model/scoreModel');
const mongoose = require('mongoose');

const getRecentExams = async (req, res) => {
  try {
    const { subject } = req.query;
    const teacherId = new mongoose.Types.ObjectId(req.user.userId);

    const exams = await RecentActivity.find({
      teacherId,
      activityType: 'exam_added',
      description: { $regex: subject, $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .limit(4);

    res.status(200).json(exams);
  } catch (error) {
    console.error('Error fetching recent exams:', error);
    res.status(500).json({ message: 'Error fetching recent exams', error: error.message });
  }
};

const getTopScorersByYear = async (req, res) => {
  try {
    const { subject } = req.query;
    const years = ['2014', '2015', '2016'];
    const result = {};

    for (const year of years) {
      const topScorers = await Score.aggregate([
        { $match: { subject: new RegExp(`^${subject}$`, 'i'), year } },
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'studentInfo'
          }
        },
        { $unwind: '$studentInfo' },
        {
          $group: {
            _id: '$student',
            name: { $first: '$studentInfo.name' },
            totalScore: { $sum: '$score' },
            totalQuestions: { $sum: '$totalQuestions' }
          }
        },
        {
          $project: {
            name: 1,
            percentage: { $multiply: [{ $divide: ['$totalScore', '$totalQuestions'] }, 100] }
          }
        },
        { $sort: { percentage: -1 } },
        { $limit: 3 }
      ]);

      result[year] = topScorers;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching top scorers by year:', error);
    res.status(500).json({ message: 'Error fetching top scorers by year', error: error.message });
  }
};

const getOverallTopScorers = async (req, res) => {
  try {
    const { subject } = req.query;

    const topScorers = await Score.aggregate([
      { $match: { subject: new RegExp(`^${subject}$`, 'i') } },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $group: {
          _id: '$student',
          name: { $first: '$studentInfo.name' },
          totalScore: { $sum: '$score' },
          totalQuestions: { $sum: '$totalQuestions' }
        }
      },
      {
        $project: {
          name: 1,
          percentage: { $multiply: [{ $divide: ['$totalScore', '$totalQuestions'] }, 100] }
        }
      },
      { $sort: { percentage: -1 } },
      { $limit: 3 }
    ]);

    res.status(200).json(topScorers);
  } catch (error) {
    console.error('Error fetching overall top scorers:', error);
    res.status(500).json({ message: 'Error fetching overall top scorers', error: error.message });
  }
};

const getSubjectActivitiesAndScores = async (req, res) => {
  try {
    const { subject } = req.query;
    const teacherId = new mongoose.Types.ObjectId(req.user.userId);

    const activities = await RecentActivity.find({
      teacherId,
      description: { $regex: subject, $options: 'i' }
    }).sort({ createdAt: -1 });

    const scores = await Score.aggregate([
      { $match: { subject: new RegExp(`^${subject}$`, 'i') } },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          studentName: '$studentInfo.name',
          year: 1,
          score: 1,
          totalQuestions: 1,
          percentage: { $multiply: [{ $divide: ['$score', '$totalQuestions'] }, 100] },
          submittedAt: 1
        }
      },
      { $sort: { submittedAt: -1 } }
    ]);

    res.status(200).json({ activities, scores });
  } catch (error) {
    console.error('Error fetching subject activities and scores:', error);
    res.status(500).json({ message: 'Error fetching subject data', error: error.message });
  }
};

module.exports = {
  getRecentExams,
  getTopScorersByYear,
  getOverallTopScorers,
  getSubjectActivitiesAndScores
};