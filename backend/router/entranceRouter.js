const express = require("express")
const router = express.Router()
const entranceController = require("../controller/entranceController")
const verifyToken = require("../middleware/authMiddleware")
const upload = require("../middleware/multerConfig")

// POST: create entrance with images support
router.post(
  "/bioEntrance",
  verifyToken,
  upload.fields([
    { name: "questionImage", maxCount: 1 },
    { name: "optionImage0", maxCount: 1 },
    { name: "optionImage1", maxCount: 1 },
    { name: "optionImage2", maxCount: 1 },
    { name: "optionImage3", maxCount: 1 },
  ]),
  entranceController.createEntrance,
)

// GET: fetch entrance exams by year
router.get("/entrance/:subject/:year", entranceController.getEntrance);

module.exports = router



