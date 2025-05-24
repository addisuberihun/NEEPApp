const express = require("express");
const router = express.Router();
const profileController = require("../controller/profileController");
const verifyToken = require("../middleware/authMiddleware");

// Get profile by ID (for both students and teachers)
router.get("/:id", verifyToken, profileController.getProfile);

module.exports = router;