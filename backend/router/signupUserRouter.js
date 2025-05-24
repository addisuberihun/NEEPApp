const express = require('express');
const router = express.Router();
const {
  signupController,
  getAllStudents,
  updateStudentPassword,
  deleteStudent,
  countStudents, // Import the new controller function
} = require('../controller/signupUserController');

router.post('/', signupController);
router.get('/', getAllStudents);
router.put('/:id', updateStudentPassword);
router.delete('/:id', deleteStudent);
router.get('/count', countStudents); // Add the new route for counting students

module.exports = router;