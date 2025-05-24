const StudentModel = require('../model/signupUserModel');

const signupController = async (req, res) => {
  try {
    // Check if the email already exists
    const existing = await StudentModel.findOne({ email: req.body.email });
    if (existing) {
      return res.status(400).json({
        errors: {
          email: {
            message: 'Email already exists',
          },
        },
      });
    }

    // Create a new student record
    const role = req.body.role || 'student';
    const newStudent = new StudentModel({ ...req.body, role });
    await newStudent.save();

    res.status(201).json({
      message: 'Student registered successfully',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = {
          message: error.errors[field].message,
        };
      }
      return res.status(400).json({ errors: validationErrors });
    }

    // Handle other errors
    res.status(500).json({
      message: 'The process has failed',
      success: false,
    });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await StudentModel.find().select('-__v -password');
    res.status(200).json({ 
      success: true,
      students 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch students' 
    });
  }
};

const updateStudentPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ message: 'Password is required', success: false });
    }
    const student = await StudentModel.findByIdAndUpdate(
      req.params.id,
      { password },
      { new: true }
    );
    if (!student) {
      return res
        .status(404)
        .json({ message: 'Student not found', success: false });
    }
    res
      .status(200)
      .json({ message: 'Password updated successfully', success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to update password', success: false });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await StudentModel.findByIdAndDelete(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ message: 'Student not found', success: false });
    }
    res
      .status(200)
      .json({ message: 'Student deleted successfully', success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to delete student', success: false });
  }
};

const countStudents = async (req, res) => {
  try {
    const studentCount = await StudentModel.countDocuments({ role: 'student' });
    res.status(200).json({
      success: true,
      count: studentCount,
      message: `${studentCount} student(s) found`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to count students',
    });
  }
};


module.exports = {
  signupController,
  getAllStudents,
  updateStudentPassword,
  deleteStudent,
  countStudents,
};