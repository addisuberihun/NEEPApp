const express = require('express');
const router = express.Router();
const noteController = require('../controller/noteController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, noteController.createNote);
router.get('/', authMiddleware, noteController.getAllNotes);
router.put('/:id', authMiddleware, noteController.updateNote);
router.delete('/:id', authMiddleware, noteController.deleteNote);

module.exports = router;
