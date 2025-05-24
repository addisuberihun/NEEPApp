const express = require('express');
const { createStudyTip, getStudyTips, updateStudyTip, deleteStudyTip } = require('../controller/addTipController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createStudyTip);
router.get('/', authMiddleware, getStudyTips);
router.put('/:id', authMiddleware, updateStudyTip);
router.delete('/:id', authMiddleware, deleteStudyTip);

module.exports = router;