require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/test");
const announcementRoutes = require("./routes/announcementRoutes");
const studentRoutes = require("./routes/studentRoutes");
const lectureRoutes = require("./routes/lectureRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());                 // ✅ REQUIRED
app.use(express.urlencoded({ extended: true }));

/* ================= NO CACHE ================= */
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

/* ================= UPLOADS ================= */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

/* ================= MONGODB ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  res.send("🚀 Smart Classroom API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/students", studentRoutes); // ✅ MUST BE PLURAL
app.use("/api/lectures", lectureRoutes);   // ✅ FIXED
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/attendance", attendanceRoutes); // ✅ REQUIRED

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
