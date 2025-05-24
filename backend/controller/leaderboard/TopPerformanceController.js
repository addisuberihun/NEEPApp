const ScoreModel = require('../../model/scoreModel');
const StudentModel = require('../../model/signupUserModel');

exports.getTopPerformers = async (req, res) => {
  try {
    const years = ['2014', '2015', '2016'];
    const result = {};

    // Pre-fetch student names to optimize lookup
    const students = await StudentModel.find({}, '_id name').lean();
    const studentMap = students.reduce((map, student) => {
      map[student._id.toString()] = student.name;
      return map;
    }, {});

    // Calculate top 3 performers for each year
    for (const year of years) {
      const scores = await ScoreModel.aggregate([
        { $match: { year } },
        {
          $group: {
            _id: '$student',
            totalScore: { $sum: '$score' },
            totalPossible: { $sum: '$totalQuestions' }
          }
        },
        { $sort: { totalScore: -1 } },
        { $limit: 3 } // Get top 3
      ]);

      result[year] = scores.map((performer, index) => ({
        rank: index + 1,
        name: studentMap[performer._id.toString()] || 'Unknown Student',
        totalScore: performer.totalScore,
        totalPossible: performer.totalPossible
      }));
    }

    // Calculate overall top 3 performers
    const overall = await ScoreModel.aggregate([
      {
        $group: {
          _id: '$student',
          totalScore: { $sum: '$score' },
          totalPossible: { $sum: '$totalQuestions' }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 3 } // Get top 3
    ]);

    result.overall = overall.map((performer, index) => ({
      rank: index + 1,
      name: studentMap[performer._id.toString()] || 'Unknown Student',
      totalScore: performer.totalScore,
      totalPossible: performer.totalPossible
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching top performers:", error);
    res.status(500).json({ message: "Failed to fetch top performers", error: error.message });
  }
};