const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const StudentModel = require("../model/signupUserModel");

// Chart data endpoint
router.get("/chartData", verifyToken, async (req, res) => {
  try {
    // Use current year by default, or allow year query parameter
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Aggregate student counts by month for the specified year
    const students = await StudentModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(year, 0, 1), // Start of year
            $lte: new Date(year, 11, 31, 23, 59, 59, 999), // End of year
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" }, // Group by month (1=Jan, 12=Dec)
          count: { $sum: 1 }, // Count students per month
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month
      },
    ]);

    // Define month labels
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const labels = monthNames;
    const values = Array(12).fill(0); // Initialize counts for all months

    // Fill values with actual counts
    students.forEach((month) => {
      const monthIndex = month._id - 1; // Convert to 0-based index
      if (monthIndex >= 0 && monthIndex < 12) {
        values[monthIndex] = month.count;
      }
    });

    res.status(200).json({
      success: true,
      labels,
      values,
    });
  } catch (error) {
    console.error("Chart data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
      error: error.message,
    });
  }
});

module.exports = router;