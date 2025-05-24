const TeacherModel = require('../model/teacherRegisterModel');

const signupTeacher = async (req, res) => {
    try {
        const { name, email, password, subject } = req.body;

        // Check if the email already exists
        const existing = await TeacherModel.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newTeacher = new TeacherModel({
            name,
            email,
            password,
            subject,
        });

        await newTeacher.save();
        res.status(201).json({ message: 'Teacher registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering teacher', error });
    }
};

const getTeachers = async (req, res) => {
    try {
        const teachers = await TeacherModel.find();
        res.status(200).json({ teachers });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching teachers', error });
    }
};

const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, subject } = req.body;

        const teacher = await TeacherModel.findById(id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        if (password) teacher.password = password;
        if (subject) teacher.subject = subject;

        await teacher.save();
        res.status(200).json({ message: 'Teacher updated successfully', teacher });
    } catch (error) {
        res.status(500).json({ message: 'Error updating teacher', error });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await TeacherModel.findByIdAndDelete(id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.status(200).json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting teacher', error });
    }
};

const countTeachers = async (req, res) => {
    try {
        const teacherCount = await TeacherModel.countDocuments();
        res.status(200).json({
            success: true,
            count: teacherCount,
            message: `${teacherCount} teacher(s) found`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to count teachers',
        });
    }
};

module.exports = {
    signupTeacher,
    getTeachers,
    updateTeacher,
    deleteTeacher,
    countTeachers,
};