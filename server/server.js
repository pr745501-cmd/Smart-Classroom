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
const jwt = require("jsonwebtoken");
const DirectMessage = require("./models/DirectMessage");
const presenceService = require("./services/presenceService");

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
const liveClassRoutesFactory = require("./routes/liveClassRoutes");
const chatRoutes = require("./routes/chatRoutes");
const dashboardStatsRoute = require("./routes/dashboardStatsRoute");

const app = express();

/* 🔥 HTTP SERVER */
const server = http.createServer(app);

/* 🔥 SOCKET SERVER */
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const liveClassRoutes = liveClassRoutesFactory(io);
const announcementRoutesWithIo = announcementRoutes(io);

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
app.use("/api/announcements", announcementRoutesWithIo);
app.use("/api/students", studentRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/live-class", liveClassRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardStatsRoute);

/* ================= SOCKET CHAT ================= */

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error"));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Authentication error"));
  }
});

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
  socket.on("disconnect", async () => {

    console.log("❌ User disconnected:", socket.id);
    if (socket.user) {
      presenceService.userDisconnected(socket.user.id, socket.id, io);
      // If faculty disconnects while in a meeting, end the meeting
      if (socket.user.role === 'faculty' && socket.meetingSessionId) {
        try {
          const LiveClass = require('./models/LiveClass');
          const liveClass = await LiveClass.findByIdAndUpdate(
            socket.meetingSessionId,
            { isLive: false, endedAt: new Date() },
            { new: true }
          );
          if (liveClass) {
            io.to(socket.meetingSessionId).emit('meetingEnded', { sessionId: socket.meetingSessionId });
          }
        } catch (err) {
          console.error('Error ending meeting on disconnect:', err);
        }
      }
    }

  });

  // ===== PRESENCE =====
  if (socket.user) {
    presenceService.userConnected(socket.user.id, socket.id);
    presenceService.userOnline(socket.user.id, io);
    // Personal inbox channel — receive DM list updates without joining each chat room
    socket.join(`user:${String(socket.user.id)}`);
  }

  // ===== JOIN DM ROOM =====
  socket.on("joinDM", ({ roomId }) => {
    socket.join(roomId);
  });

  socket.on("leaveDM", ({ roomId }) => {
    if (roomId) socket.leave(roomId);
  });

  // ===== SEND DM =====
  socket.on("sendDM", async ({ roomId, recipientId, text, senderId }) => {
    if (!socket.user || socket.user.id !== senderId) {
      socket.emit("error", { message: "Unauthorized sender" });
      return;
    }
    try {
      const msg = new DirectMessage({
        sender: senderId,
        recipient: recipientId,
        text,
        readStatus: false
      });
      await msg.save();
      io.to(roomId).emit("receiveDM", msg);

      const lastMessage = {
        text: msg.text,
        timestamp: msg.timestamp || new Date()
      };
      const rid = String(recipientId);
      const sid = String(senderId);
      io.to(`user:${rid}`).emit("dmInboxUpdate", {
        peerId: sid,
        lastMessage,
        incrementUnread: true
      });
      io.to(`user:${sid}`).emit("dmInboxUpdate", {
        peerId: rid,
        lastMessage,
        incrementUnread: false
      });

      // Check if recipient is in the room
      const roomSockets = await io.in(roomId).fetchSockets();
      const recipientInRoom = roomSockets.some(s => s.user && s.user.id === recipientId);
      if (recipientInRoom) {
        socket.emit("delivered", { msgId: msg._id });
      }
    } catch (err) {
      console.error("sendDM error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ===== MARK READ =====
  socket.on("markRead", async ({ roomId, contactId }) => {
    if (!socket.user) return;
    try {
      await DirectMessage.updateMany(
        { sender: contactId, recipient: socket.user.id, readStatus: false },
        { readStatus: true }
      );
      io.to(roomId).emit("messagesRead", { contactId: socket.user.id });
      io.to(`user:${String(socket.user.id)}`).emit("dmInboxUpdate", {
        peerId: String(contactId),
        resetUnread: true
      });
    } catch (err) {
      console.error("markRead error:", err);
    }
  });

  // ===== TYPING =====
  socket.on("typing", ({ roomId }) => {
    if (!socket.user) return;
    socket.to(roomId).emit("typing", { userId: socket.user.id });
  });

  socket.on("stopTyping", ({ roomId }) => {
    if (!socket.user) return;
    socket.to(roomId).emit("stopTyping", { userId: socket.user.id });
  });

  // ===== ANNOUNCEMENTS REAL-TIME =====
  socket.on("joinAnnouncements", () => {
    socket.join("announcements");
  });

  // ===== MEETING ROOM SIGNALING =====

  socket.on('joinMeetingRoom', async ({ sessionId }) => {
    socket.join(sessionId);
    socket.meetingSessionId = sessionId;

    // Get all existing sockets in the room (excluding the newcomer)
    const roomSockets = await io.in(sessionId).fetchSockets();
    const existingParticipants = roomSockets
      .filter(s => s.id !== socket.id)
      .map(s => ({
        socketId: s.id,
        userId: s.user?.id,
        name: s.user?.name || s.user?.email || 'Participant',
        role: s.user?.role || 'student'
      }));

    // Tell the newcomer who is already in the room
    socket.emit('existingParticipants', existingParticipants);

    // Tell everyone else that a new participant joined
    socket.to(sessionId).emit('participantJoined', {
      socketId: socket.id,
      userId: socket.user?.id,
      name: socket.user?.name || socket.user?.email || 'Participant',
      role: socket.user?.role
    });
  });

  socket.on('leaveMeetingRoom', ({ sessionId }) => {
    socket.leave(sessionId);
    socket.meetingSessionId = null;
    io.to(sessionId).emit('participantLeft', {
      socketId: socket.id,
      userId: socket.user?.id,
      name: socket.user?.name || socket.user?.email,
      role: socket.user?.role
    });
  });

  socket.on('offer', ({ sessionId, targetSocketId, sdp }) => {
    io.to(targetSocketId).emit('offer', { fromSocketId: socket.id, sdp });
  });

  socket.on('answer', ({ sessionId, targetSocketId, sdp }) => {
    io.to(targetSocketId).emit('answer', { fromSocketId: socket.id, sdp });
  });

  socket.on('iceCandidate', ({ sessionId, targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('iceCandidate', { fromSocketId: socket.id, candidate });
  });

  // —— In-meeting Zoom-like features (chat, hands, mic/cam indicators) ——
  socket.on('meetingChat', ({ sessionId, text }) => {
    if (!socket.user || !sessionId || !text || !String(text).trim()) return;
    const trimmed = String(text).trim().slice(0, 4000);
    io.to(sessionId).emit('meetingChat', {
      socketId: socket.id,
      name: socket.user.name || socket.user.email || 'Participant',
      text: trimmed,
      at: Date.now()
    });
  });

  socket.on('meetingMediaState', ({ sessionId, audioEnabled, videoEnabled }) => {
    if (!sessionId) return;
    socket.to(sessionId).emit('meetingMediaState', {
      socketId: socket.id,
      audioEnabled: !!audioEnabled,
      videoEnabled: !!videoEnabled
    });
  });

  socket.on('meetingRaiseHand', ({ sessionId }) => {
    if (!socket.user || !sessionId) return;
    io.to(sessionId).emit('meetingRaiseHand', {
      socketId: socket.id,
      name: socket.user.name || socket.user.email || 'Participant'
    });
  });

  socket.on('meetingLowerHand', ({ sessionId }) => {
    if (!sessionId) return;
    socket.to(sessionId).emit('meetingLowerHand', { socketId: socket.id });
  });

}); // 🔴 IMPORTANT: connection block closed here

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});