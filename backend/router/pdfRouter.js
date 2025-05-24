const express = require("express")
const router = express.Router()

const upload = require("../middleware/pdfUpload") // multer config
const pdfController = require("../controller/resourceController") // Make sure this path is correct
const verifyToken = require("../middleware/authMiddleware")

// Check if controller functions exist before using them
if (!pdfController.uploadPDF) {
  console.error("Error: uploadPDF function is not defined in the controller")
}

if (!pdfController.downloadPDF) {
  console.error("Error: downloadPDF function is not defined in the controller")
}

if (!pdfController.getAllPDFs) {
  console.error("Error: getAllPDFs function is not defined in the controller")
}

if (!pdfController.deletePDF) {
  console.error("Error: deletePDF function is not defined in the controller")
}

// Upload route (POST /api/pdfs)
router.post("/pdfs", upload.single("file"), pdfController.uploadPDF)

// Get all PDFs route
router.get("/pdfs", verifyToken, pdfController.getAllPDFs)

// Download a PDF by ID (students download the PDF)
router.get("/pdfs/download/:id", verifyToken, pdfController.downloadPDF)

// Delete a PDF by ID (teachers delete the PDF)
router.delete("/pdfs/:id", verifyToken, pdfController.deletePDF)

module.exports = router
