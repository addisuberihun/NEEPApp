const express = require("express");
const router = express.Router();
const quizController = require("../controller/quizeController");
const verifyToken = require("../middleware/authMiddleware");

// ✅ Leave route as is, just add token verification
router.post('/', verifyToken, quizController.addQuize);
router.get('/', quizController.getQuize);

module.exports = router;
