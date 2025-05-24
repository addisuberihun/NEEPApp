const express = require("express")
const router = express.Router()
const pdfController = require("../controller/resourceController") // Make sure this path is correct
const verifyToken = require("../middleware/authMiddleware")
router.get('/:id', verifyToken, pdfController.downloadPDF);

module.exports = router