const express = require('express');
const router = express.Router();
const { signupTeacher, getTeachers, updateTeacher, deleteTeacher, countTeachers } = require('../controller/teacherRcontroll');

router.post('/', signupTeacher);
router.get('/', getTeachers);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);
router.get('/count', countTeachers);

module.exports = router;