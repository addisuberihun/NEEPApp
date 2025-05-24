const express = require("express");
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const cors = require("cors");

require("dotenv").config();
const connectdb = require("./config/db");
const { initializeSocket } = require("./socket/socketManager");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(cors({
  origin: ["http://localhost:8081", "http://192.168.137.91:8081"], // ✅ Add your current port
  credentials: true
}));

// Pass io to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Connect to database
connectdb();

app.use("/uploads", express.static(path.join(__dirname, "Uploads")));
app.use("/uploadedPdf", express.static(path.join(__dirname, "uploadedPdfs")));

const signupStudent = require("./router/signupUserRouter");
app.use("/api/v1/signup/", signupStudent);

const signupTeacher = require("./router/teacherRegisterR");
app.use("/api/v1/teacher/", signupTeacher);

const loginUser = require("./router/loginUserRouter");
app.use("/api/v1/login/", loginUser);

const passwordReset = require("./router/forgotPasswordRouter");
app.use("/api/v1/password/", passwordReset);

const studentProfileRouter = require("./router/studentProfileR");
app.use("/api/v1/students/", studentProfileRouter);

// Add and display quiz
const quiz = require("./router/quizeRouter");
app.use("/api/v1/quiz", quiz);

// Add entrance exam and display it
const entrance = require("./router/entranceRouter");
app.use("/api/v1", entrance);

// Add shortnote and display it
const noteRoutes = require("./router/noteRouter");
app.use("/api/v1/notes", noteRoutes);

// PDF upload API
const pdfRoutes = require("./router/pdfRouter");
app.use("/api/v1", pdfRoutes);

// Notification API when new PDF uploads
const notification = require("./router/notificationRoute");
app.use("/api/v1/notifications", notification);

// Score
const scoreAdd = require("./router/scoreRouter");
app.use("/api/v1/score", scoreAdd);

// Top Performers
const topPerformersRouter = require("./router/leaderboard/TopPerformanceRouter");
app.use("/api/v1/top-performers", topPerformersRouter);

// Chat routes
const chatRoutes = require("./router/chatRouter");
app.use("/api/v1/chat", chatRoutes);

const quizScoreRoutes = require("./router/quizScoreRouter");
app.use("/api/v1/quizscore", quizScoreRoutes);

// Leaderboard
const entranceleader = require("./router/leaderboard/entranceleaderRouter");
app.use("/api/v1/leaderboard", entranceleader);

const quizleaderRoutes = require("./router/leaderboard/quizleaderRouter");
app.use("/api/v1/quizleader", quizleaderRoutes);

const progressRoutes = require("./router/leaderboard/quizprogressRouter");
app.use("/api/v1/progress", progressRoutes);

// Profile route
const profileRoute = require("./router/profileRouter");
app.use("/api/v1/profile", profileRoute);

// Recent activity route
const recentActivityRoute = require("./router/recentActivityRouter");
app.use("/api/v1/recent-activities", recentActivityRoute);

// Chart data route
const chartDataRoutes = require("./router/chartDataRouter");
app.use("/api/v1", chartDataRoutes);

// Teacher stats route
const teacherStatsRoutes = require("./router/teacherStatsRouter");
app.use("/api/v1", teacherStatsRoutes);

// Exam analysis route
const examAnalysisRoutes = require("./router/leaderboard/examAnalysisRouter");
app.use("/api/v1/exam-analysis", examAnalysisRoutes);

// Study tips route
const addTipRouter = require("./router/addTipRouter");
app.use("/api/v1/addtips", addTipRouter);

// User activity route
const userActivityRouter = require("./router/userActivityRouter");
app.use("/api/v1/user-activity", userActivityRouter);

// Connection
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`The server running on ${port}`);
});
