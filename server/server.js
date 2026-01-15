// server.js

// ================== CONFIG ==================
require("dotenv").config(); // Load environment variables first

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// ================== ROUTES ==================
const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/test");
const announcementRoutes = require("./routes/announcementRoutes");
const studentRoutes = require("./routes/studentRoutes");
const lectureRoutes = require("./routes/lectureRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

// ================== APP INIT ==================
const app = express();

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable cache
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ================== UPLOADS FOLDER ==================
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("📁 uploads folder created");
}

app.use("/uploads", express.static(uploadsDir));

// ================== MONGODB CONNECTION ==================
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("❌ MONGO_URI is not defined in .env!");
  process.exit(1);
}

// ✅ Fixed connection: remove unsupported options
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Atlas Connection Error:");
    console.error(err.message);
    process.exit(1); // Stop server if DB connection fails
  });

// ================== TEST ROUTE ==================
app.get("/", (req, res) => {
  res.send("🚀 Smart Classroom API Running");
});

// ================== ROUTES ==================
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/announcement", announcementRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/lecture", lectureRoutes);
app.use("/api/assignment", assignmentRoutes);
app.use("/api/submission", submissionRoutes);

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
