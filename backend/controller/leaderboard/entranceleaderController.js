const ScoreModel = require('../../model/scoreModel');
const StudentModel = require('../../model/signupUserModel');

const entranceboardController = async (req, res) => {
  try {
    const { subject = 'All', year = 'All', studentId } = req.query;

    const query = {};

    // If studentId is provided, return raw exam data for that student
    if (studentId) {
      query.student = studentId;
      if (subject !== 'All') {
        query.subject = new RegExp(`^${subject}$`, 'i');
      }
      if (year !== 'All') {
        query.year = year;
      }

      const scores = await ScoreModel.find(query)
        .populate('student', 'name')
        .sort({ submittedAt: -1 });

      const formattedScores = scores.map(score => ({
        student: score.student?._id,
        studentName: score.student?.name || 'Unknown',
        subject: score.subject,
        year: score.year,
        score: score.score,
        totalQuestions: score.totalQuestions,
        percentage: (score.score / score.totalQuestions) * 100,
        submittedAt: score.submittedAt
      }));

      return res.status(200).json(formattedScores);
    }

    // Original leaderboard logic for entranceLeaderBoard.js
    if (subject !== 'All') {
      query.subject = new RegExp(`^${subject}$`, 'i');
    }

    if (year !== 'All') {
      query.year = year;
    }

    // Aggregate scores when subject = All and year is specified
    if (subject === 'All' && year !== 'All') {
      const aggregatedScores = await ScoreModel.aggregate([
        {
          $match: {
            ...query,
            year
          }
        },
        {
          $group: {
            _id: '$student',
            totalScore: { $sum: '$score' },
            totalQuestions: { $sum: '$totalQuestions' }
          }
        },
        {
          $lookup: {
            from: 'students',
            localField: '_id',
            foreignField: '_id',
            as: 'studentDetails'
          }
        },
        { $unwind: '$studentDetails' },
        {
          $project: {
            studentName: '$studentDetails.name',
            totalScore: 1,
            totalQuestions: 1,
            percentage: {
              $multiply: [
                { $divide: ['$totalScore', '$totalQuestions'] },
                100
              ]
            }
          }
        },
        { $sort: { percentage: -1, totalScore: -1 } },
        { $limit: 10 }
      ]);

      return res.status(200).json(aggregatedScores);
    }

    // Aggregate for specific subject and year
    if (subject !== 'All' && year !== 'All') {
      const aggregatedSubjectScores = await ScoreModel.aggregate([
        {
          $match: {
            ...query,
            subject: { $regex: `^${subject}$`, $options: 'i' },
            year
          }
        },
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'studentDetails'
          }
        },
        { $unwind: '$studentDetails' },
        {
          $project: {
            studentName: '$studentDetails.name',
            subject: 1,
            year: 1,
            score: 1,
            totalQuestions: 1,
            percentage: {
              $multiply: [
                { $divide: ['$score', '$totalQuestions'] },
                100
              ]
            },
            submittedAt: 1
          }
        },
        { $sort: { percentage: -1, score: -1 } },
        { $limit: 10 }
      ]);

      return res.status(200).json(aggregatedSubjectScores);
    }

    // Fallback for other combinations
    const scores = await ScoreModel.find(query)
      .populate('student', 'name')
      .sort({ score: -1 })
      .limit(10);

    const formattedScores = scores.map(score => ({
      studentName: score.student?.name || 'Unknown',
      score: score.score,
      totalQuestions: score.totalQuestions,
      percentage: (score.score / score.totalQuestions) * 100,
      subject: score.subject,
      year: score.year,
      submittedAt: score.submittedAt
    }));

    res.status(200).json(formattedScores);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      message: "Failed to fetch leaderboard",
      error: error.message
    });
  }
};

module.exports = entranceboardController;

// const ScoreModel = require('../../model/scoreModel');
// const StudentModel = require('../../model/signupUserModel');

// const entranceboardController = async (req, res) => {
//   try {
//     const { subject = 'All', year = 'All' } = req.query;

//     const query = {};

//     // Add subject filter with case-insensitive match
//     if (subject !== 'All') {
//       query.subject = new RegExp(`^${subject}$`, 'i');
//     }

//     if (year !== 'All') {
//       query.year = year;
//     }

//     // When subject = All and year is specified → aggregate scores across subjects
//     if (subject === 'All' && year !== 'All') {
//       const aggregatedScores = await ScoreModel.aggregate([
//         {
//           $match: {
//             year
//           }
//         },
//         {
//           $group: {
//             _id: '$student',
//             totalScore: { $sum: '$score' },
//             totalQuestions: { $sum: '$totalQuestions' }
//           }
//         },
//         {
//           $lookup: {
//             from: 'students',
//             localField: '_id',
//             foreignField: '_id',
//             as: 'studentDetails'
//           }
//         },
//         { $unwind: '$studentDetails' },
//         {
//           $project: {
//             studentName: '$studentDetails.name',
//             totalScore: 1,
//             totalQuestions: 1,
//             percentage: {
//               $multiply: [
//                 { $divide: ['$totalScore', '$totalQuestions'] },
//                 100
//               ]
//             }
//           }
//         },
//         { $sort: { percentage: -1, totalScore: -1 } },
//         { $limit: 10 }
//       ]);

//       return res.status(200).json(aggregatedScores);
//     }

//     // When a specific subject is selected → also handle aggregation here with $match regex
//     if (subject !== 'All' && year !== 'All') {
//       const aggregatedSubjectScores = await ScoreModel.aggregate([
//         {
//           $match: {
//             subject: { $regex: `^${subject}$`, $options: 'i' }, // Case-insensitive subject match
//             year
//           }
//         },
//         {
//           $lookup: {
//             from: 'students',
//             localField: 'student',
//             foreignField: '_id',
//             as: 'studentDetails'
//           }
//         },
//         { $unwind: '$studentDetails' },
//         {
//           $project: {
//             studentName: '$studentDetails.name',
//             subject: 1,
//             year: 1,
//             score: 1,
//             totalQuestions: 1,
//             percentage: {
//               $multiply: [
//                 { $divide: ['$score', '$totalQuestions'] },
//                 100
//               ]
//             }
//           }
//         },
//         { $sort: { percentage: -1, score: -1 } },
//         { $limit: 10 }
//       ]);

//       return res.status(200).json(aggregatedSubjectScores);
//     }

//     // For other combinations, fallback to find + populate
//     const scores = await ScoreModel.find(query)
//       .populate('student', 'name')
//       .sort({ score: -1 })
//       .limit(10);

//     const formattedScores = scores.map(score => ({
//       studentName: score.student?.name || 'Unknown',
//       score: score.score,
//       totalQuestions: score.totalQuestions,
//       percentage: (score.score / score.totalQuestions) * 100,
//       subject: score.subject,
//       year: score.year
//     }));

//     res.status(200).json(formattedScores);
//   } catch (error) {
//     console.error("Error fetching leaderboard:", error);
//     res.status(500).json({
//       message: "Failed to fetch leaderboard",
//       error: error.message
//     });
//   }
// };

// module.exports = entranceboardController;

