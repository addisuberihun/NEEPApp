const express = require('express');
const progressController = require('../controller/quizProgressController');
const router = express.Router();

router.post('/unlock-level', progressController.unlockLevel);
router.get('/:studentId', progressController.getProgress);

module.exports = router;