// 🔥 FORCE GOOGLE DNS (Fix SRV ECONNREFUSED)
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const fs = require("fs");

/* 🔥 CHAT */
const http = require("http");
const { Server } = require("socket.io");

/* 🔥 CHAT MODEL */
const ChatMessage = require("./models/ChatMessage");

/* ROUTES */
const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/test");
const announcementRoutes = require("./routes/announcementRoutes");
const studentRoutes = require("./routes/studentRoutes");
const lectureRoutes = require("./routes/lectureRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const liveClassRoutes = require("./routes/liveClassRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

/* 🔥 HTTP SERVER */
const server = http.createServer(app);

/* 🔥 SOCKET SERVER */
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

/* ================= PERFORMANCE ================= */

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/* ================= NO CACHE ================= */

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/* ================= UPLOADS ================= */

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use("/uploads", express.static(uploadsDir));

/* ================= MONGODB ================= */

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10
})
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));

/* ================= ROUTES ================= */

app.get("/", (req, res) => {
  res.send("🚀 Smart Classroom API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/live-class", liveClassRoutes);
app.use("/api/chat", chatRoutes);

/* ================= SOCKET CHAT ================= */

io.on("connection", (socket) => {

  console.log("💬 User connected:", socket.id);

  /* JOIN ROOM */
  socket.on("joinLecture", async (lectureId) => {

    socket.join(lectureId);

    console.log("User joined room:", lectureId);

    try {

      const history = await ChatMessage
        .find({ lectureId })
        .sort({ createdAt: 1 })
        .limit(100);

      socket.emit("chatHistory", history);

    } catch (err) {

      console.error("History load error:", err);

    }

  });

  /* SEND MESSAGE */
  socket.on("sendMessage", async (data) => {

    try {

      console.log("Message received:", data);

      const msg = new ChatMessage({
        lectureId: data.lectureId,
        senderName: data.senderName,
        senderRole: data.senderRole,
        message: data.message
      });

      await msg.save();

      // broadcast to everyone in room
      io.to(data.lectureId).emit("receiveMessage", msg);

    } catch (err) {

      console.error("Message save error:", err);

    }

  });

  /* DISCONNECT */
  socket.on("disconnect", () => {

    console.log("❌ User disconnected:", socket.id);

  });

}); // 🔴 IMPORTANT: connection block closed here

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});