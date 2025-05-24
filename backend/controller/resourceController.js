const PDF = require("../model/pdfModel");
const Student = require("../model/signupUserModel"); 
const Notification = require("../model/notificationModel");
const PDFDownload = require("../model/pdfDownloadModel");
const RecentActivity = require("../model/recentActivityModel");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Upload PDF
exports.uploadPDF = async (req, res) => {
  try {
    const { title, subject } = req.body;

    // Multer puts the file info in req.file
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    // Get just the filename
    const fileName = path.basename(req.file.path);
    
    // Create the file URL (relative URL for web access)
    const fileUrl = `/uploadedPdfs/${fileName}`;
    
    // Extract teacher ID from JWT token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, "yourSecretKey");
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Check if user is a teacher
    if (decodedToken.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can upload PDFs" });
    }

    // Validate userId as a valid ObjectId
    if (!mongoose.isValidObjectId(decodedToken.userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Create the PDF document object
    const pdfData = {
      title,
      subject,
      uploadedBy: decodedToken.userId,
      fileUrl: fileUrl,
      filePath: req.file.path // Include filePath as per schema
    };
    
    // Save the PDF document in the database
    const newPDF = new PDF(pdfData);
    const savedPDF = await newPDF.save();
    
    // Create a notification for this PDF upload
    try {
      // Find students who should receive this notification (e.g., by subject)
      // Option 1: Create notification for specific students by subject
      // const students = await Student.find({ subjects: { $in: [subject] } });
      // const studentIds = students.map(student => student._id);
      
      // Option 2: Create a general notification without specific recipients
      const notification = new Notification({
        title: "New Study Material Available",
        message: `A new document "${title}" has been uploaded for ${subject}`,
        type: "pdf_upload",
        relatedItem: {
          itemId: savedPDF._id,
          itemType: "PDF"
        },
        subject: subject,
        readBy: [], // Initialize with empty array
        // recipients: studentIds // Uncomment if using Option 1
      });
      
      await notification.save();
      console.log("Notification created for new PDF upload");
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification creation fails
    }
    
    // Save recent activity
    try {
      const activity = new RecentActivity({
        teacherId: new mongoose.Types.ObjectId(decodedToken.userId),
        activityType: "pdf_added",
        description: `Uploaded a new PDF: "${title}" for ${subject}`,
        resourceId: savedPDF._id,
      });
      
      await activity.save();
      console.log("Recent activity logged for PDF upload");
    } catch (activityError) {
      console.error("Error logging recent activity:", activityError);
      // Continue with the response even if activity logging fails
    }

    res.status(201).json({
      message: "PDF uploaded successfully",
      pdf: {
        id: savedPDF._id,
        title: savedPDF.title,
        subject: savedPDF.subject,
        fileUrl: savedPDF.fileUrl,
        uploadedBy: savedPDF.uploadedBy,
      },
    });
  } catch (error) {
    console.error("Error uploading PDF:", error);
    res.status(500).json({ message: "Error uploading PDF", error: error.message });
  }
};

// Download PDF by ID
exports.downloadPDF = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    // Extract user ID from JWT token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, "yourSecretKey");
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = decodedToken.userId;
    const userRole = decodedToken.role;

    // Only track downloads for students
    if (userRole === "student") {
      try {
        // Record the download (upsert in case they've downloaded before)
        await PDFDownload.findOneAndUpdate(
          { pdfId: pdf._id, studentId: userId },
          { downloadedAt: new Date() },
          { upsert: true, new: true }
        );
      } catch (trackError) {
        console.error("Error tracking download:", trackError);
        // Continue with download even if tracking fails
      }
    }

    // Extract the filename from the fileUrl
    const fileName = path.basename(pdf.fileUrl);
    
    // Reconstruct the absolute path
    const filePath = path.resolve(process.cwd(), 'uploadedPdfs', fileName);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        message: "PDF file not found on server", 
        path: filePath
      });
    }

    // Send the file for download
    res.download(filePath, `${pdf.title}.pdf`, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ message: "Error downloading PDF", error: err.message });
      }
    });
  } catch (error) {
    console.error("Error in download route:", error);
    res.status(500).json({ message: "Error downloading PDF", error: error.message });
  }
};

// Get all PDFs with download status for the current student
exports.getAllPDFs = async (req, res) => {
  try {
    // Extract user ID from JWT token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, "yourSecretKey");
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = decodedToken.userId;
    const userRole = decodedToken.role;

    // Get all PDFs
    const pdfs = await PDF.find();

    // If user is a student, get their download history
    if (userRole === "student") {
      // Get all downloads for this student
      const downloads = await PDFDownload.find({ studentId: userId });
      
      // Create a map of pdfId -> downloadedAt for quick lookup
      const downloadMap = {};
      downloads.forEach(download => {
        downloadMap[download.pdfId.toString()] = download.downloadedAt;
      });
      
      // Add download status to each PDF
      const pdfsWithStatus = pdfs.map(pdf => {
        const pdfObj = pdf.toObject();
        const pdfId = pdf._id.toString();
        
        pdfObj.isDownloaded = pdfId in downloadMap;
        if (pdfObj.isDownloaded) {
          pdfObj.downloadedAt = downloadMap[pdfId];
        }
        
        return pdfObj;
      });
      
      return res.status(200).json(pdfsWithStatus);
    }
    
    // For non-students, just return the PDFs without download status
    res.status(200).json(pdfs);
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    res.status(500).json({ message: "Error fetching PDFs", error: error.message });
  }
};

// Delete PDF by ID
exports.deletePDF = async (req, res) => {
  try {
    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify token and check role
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, "yourSecretKey");
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ message: "Invalid token" });
    }

    if (decodedToken.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can delete PDFs" });
    }

    // Validate PDF ID
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid PDF ID format" });
    }

    // Find the PDF
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    // Check if the teacher uploaded this PDF
    if (pdf.uploadedBy.toString() !== decodedToken.userId) {
      return res.status(403).json({ message: "You can only delete PDFs you uploaded" });
    }

    // Delete the file from the filesystem
    if (pdf.filePath) {
      let filePath;
      // Handle both relative and absolute paths
      if (pdf.filePath.startsWith('/')) {
        // If absolute path stored, use it directly
        filePath = pdf.filePath;
      } else {
        // Construct absolute path from relative
        filePath = path.resolve(process.cwd(), pdf.filePath);
      }
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`File deleted: ${filePath}`);
        } catch (fileError) {
          console.error(`Error deleting file at ${filePath}:`, fileError.message);
          // Log but don't fail the request
        }
      } else {
        console.warn(`File not found on server: ${filePath}`);
      }
    } else {
      console.warn("No filePath found in PDF document");
    }

    // Delete related RecentActivity entries
    try {
      const activityResult = await RecentActivity.deleteMany({ resourceId: pdf._id });
      console.log(`Deleted ${activityResult.deletedCount} recent activities`);
    } catch (activityError) {
      console.error("Error deleting recent activities:", activityError.message);
      // Continue with deletion
    }

    // Delete related Notification entries
    try {
      const notificationResult = await Notification.deleteMany({ 
        "relatedItem.itemId": pdf._id, 
        "relatedItem.itemType": "PDF" 
      });
      console.log(`Deleted ${notificationResult.deletedCount} notifications`);
    } catch (notificationError) {
      console.error("Error deleting notifications:", notificationError.message);
      // Continue with deletion
    }

    // Delete related PDFDownload entries
    try {
      const downloadResult = await PDFDownload.deleteMany({ pdfId: pdf._id });
      console.log(`Deleted ${downloadResult.deletedCount} download records`);
    } catch (downloadError) {
      console.error("Error deleting download records:", downloadError.message);
      // Continue with deletion
    }

    // Delete the PDF from the database
    try {
      await PDF.findByIdAndDelete(req.params.id);
      console.log(`PDF ${req.params.id} deleted from database`);
    } catch (dbError) {
      console.error("Error deleting PDF from database:", dbError.message);
      return res.status(500).json({ 
        message: "Error deleting PDF from database", 
        error: dbError.message 
      });
    }

    res.status(200).json({ message: "PDF deleted successfully" });
  } catch (error) {
    console.error("Error in deletePDF:", error.message, error.stack);
    res.status(500).json({ 
      message: "Error deleting PDF", 
      error: error.message 
    });
  }
};





