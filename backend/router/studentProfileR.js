const express = require('express');
const { getStudentProfile } = require('../controller/studentProfileC');
const router = express.Router();

// Route to get student profile by ID
router.get('/:id', getStudentProfile);

module.exports = router;