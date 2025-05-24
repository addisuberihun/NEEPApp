const jwt = require('jsonwebtoken');
const Student = require("../model/signupUserModel");
const Teacher = require("../model/teacherRegisterModel");

const loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    // First check if the user is a student or admin
    const student = await Student.findOne({ email });

    if (student) {
      // Check password (implement hashing in production)
      if (student.password !== password) {
        return res.status(400).send({ message: "Wrong password" });
      }

      // ✅ Generate JWT token for student/admin
      const token = jwt.sign(
        {
          userId: student._id,
          role: student.role, // super_admin or student
          stream: student.stream, // Include stream in token
        },
        'yourSecretKey', // 🔐 Replace this with an env var in production!
        { expiresIn: '1h' }
      );

      // Redirect based on student role and stream
      switch (student.role) {
        case "super_admin":
          return res.status(200).json({
            token,
            redirect: "/admin",
            userId: student._id,
            role: "super_admin",
          });
        case "student":
          return res.status(200).json({
            token,
            redirect: student.stream === "Natural" ? `/student/${student._id}` : `/Social/${student._id}`,
            userId: student._id,
            role: "student",
            stream: student.stream,
          });
        default:
          return res.status(400).send({ message: "Invalid role" });
      }
    }

    // If not a student, check if it's a teacher
    const teacher = await Teacher.findOne({ email });

    if (teacher) {
      if (teacher.password !== password) {
        return res.status(400).send({ message: "Wrong password" });
      }

      // ✅ Generate JWT token for teacher including their subject
      const token = jwt.sign(
        {
          userId: teacher._id,
          role: "teacher",
          subject: teacher.subject, // 👈 include the assigned subject
        },
        'yourSecretKey', // 🔐 Replace this with an env var in production!
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        token,
        redirect: `/teacher/${teacher._id}`,
        userId: teacher._id,
        role: "teacher",
        subject: teacher.subject,
      });
    }

    // If neither student nor teacher, return error
    return res.status(400).send({ message: "Invalid email or password" });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({
      message: "An error occurred",
      error: error.message,
    });
  }
};

module.exports = loginController;


