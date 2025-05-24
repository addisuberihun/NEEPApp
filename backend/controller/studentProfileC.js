const User = require('../model/signupUserModel');

const getStudentProfile = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        if (!student) {
            return res.status(404).send({ message: "Student not found" });
        }
        res.status(200).json(student);
    } catch (error) {
        res.status(500).send({ message: 'Server error', error });
    }
};

module.exports = { getStudentProfile };