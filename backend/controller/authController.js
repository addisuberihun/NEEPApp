// controllers/authController.js
const StudentModel = require('../model/studentRegisterModel');
const TeacherModel = require('../model/teacherRegisterModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Sign up for students
exports.signupStudent = async (req, res) => {
    try {
        const { name, email, password, phoneNumber} = req.body;

        // Check if the email already exists
        const existing = await StudentModel.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new student
        const newStudent = new StudentModel({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
           
        });

        await newStudent.save();
        res.status(201).json({ message: 'Student registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering student', error });
    }
};

// Sign up for teachers
exports.signupTeacher = async (req, res) => {
    try {
        const { fullName, email, password, subject } = req.body;

        // Check if the email already exists
        const existing = await TeacherModel.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new teacher
        const newTeacher = new TeacherModel({
            fullName,
            email,
            password: hashedPassword,
            subject,
        });

        await newTeacher.save();
        res.status(201).json({ message: 'Teacher registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering teacher', error });
    }
};

// Login for all users
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check in students
        let user = await StudentModel.findOne({ email });
        let userType = 'student';

        // If not found in students, check in teachers
        if (!user) {
            user = await TeacherModel.findOne({ email });
            userType = 'teacher';
        }

        // If user not found
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user is a super_admin
        if (user.role === 'super_admin') {
            userType = 'super_admin';
        }

        // Check password
       const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign({ id: user._id, role: userType }, 'your_jwt_secret', { expiresIn: '1h' });

        // Send response with token and user type
        res.status(200).json({ token, userType });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};