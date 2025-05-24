const Student = require("../model/signupUserModel");
const Teacher = require("../model/teacherRegisterModel");

const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const authenticatedUserId = req.user.userId; // Changed from req.user.id to req.user.userId

    // Prevent users from fetching other users' profiles
    if (userId !== authenticatedUserId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    let user;
    if (req.user.role === "teacher") {
      user = await Teacher.findById(userId).select("-password");
    } else {
      user = await Student.findById(userId).select("-password");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

module.exports = {
  getProfile
};