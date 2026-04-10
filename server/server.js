// Fix MongoDB SRV DNS resolution issues
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const ChatMessage = require("./models/ChatMessage");
const DirectMessage = require("./models/DirectMessage");
const LiveClass = require("./models/LiveClass");
const presenceService = require("./services/presenceService");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(compression());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });

// ─── Uploads folder ───────────────────────────────────────────────────────────

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

// ─── MongoDB ──────────────────────────────────────────────────────────────────

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));

// ─── Routes ───────────────────────────────────────────────────────────────────

const liveClassRoutes = require("./routes/liveClassRoutes")(io);
const announcementRoutes = require("./routes/announcementRoutes")(io);

app.get("/", (req, res) => res.send("Smart Classroom API Running"));

app.use("/api/auth",        require("./routes/auth"));
app.use("/api/test",        require("./routes/test"));
app.use("/api/announcements", announcementRoutes);
app.use("/api/students",    require("./routes/studentRoutes"));
app.use("/api/lectures",    require("./routes/lectureRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));
app.use("/api/submissions", require("./routes/submissionRoutes"));
app.use("/api/attendance",  require("./routes/attendanceRoutes"));
app.use("/api/admin",       require("./routes/adminRoutes"));
app.use("/api/live-class",  liveClassRoutes);
app.use("/api/chat",        require("./routes/chatRoutes"));
app.use("/api/dashboard",   require("./routes/dashboardStatsRoute"));

// ─── Socket.io Auth ───────────────────────────────────────────────────────────

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

// ─── Socket.io Events ────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register presence and personal inbox channel
  if (socket.user) {
    presenceService.userConnected(socket.user.id, socket.id);
    presenceService.userOnline(socket.user.id, io);
    socket.join(`user:${socket.user.id}`);
  }

  // ── Lecture Chat ──────────────────────────────────────────────────────────

  socket.on("joinLecture", async (lectureId) => {
    socket.join(lectureId);
    try {
      const history = await ChatMessage.find({ lectureId }).sort({ createdAt: 1 }).limit(100);
      socket.emit("chatHistory", history);
    } catch (err) {
      console.error("Chat history error:", err);
    }
  });

  socket.on("sendMessage", async (data) => {
    try {
      const msg = await ChatMessage.create({
        lectureId: data.lectureId,
        senderName: data.senderName,
        senderRole: data.senderRole,
        message: data.message
      });
      io.to(data.lectureId).emit("receiveMessage", msg);
    } catch (err) {
      console.error("Message save error:", err);
    }
  });

  // ── Direct Messages ───────────────────────────────────────────────────────

  socket.on("joinDM", ({ roomId }) => socket.join(roomId));
  socket.on("leaveDM", ({ roomId }) => { if (roomId) socket.leave(roomId); });

  socket.on("sendDM", async ({ roomId, recipientId, text, senderId }) => {
    if (!socket.user || socket.user.id !== senderId) {
      return socket.emit("error", { message: "Unauthorized sender" });
    }
    try {
      const msg = await DirectMessage.create({ sender: senderId, recipient: recipientId, text, readStatus: false });
      io.to(roomId).emit("receiveDM", msg);

      const lastMessage = { text: msg.text, timestamp: msg.timestamp || new Date() };
      io.to(`user:${String(recipientId)}`).emit("dmInboxUpdate", { peerId: String(senderId), lastMessage, incrementUnread: true });
      io.to(`user:${String(senderId)}`).emit("dmInboxUpdate", { peerId: String(recipientId), lastMessage, incrementUnread: false });

      const roomSockets = await io.in(roomId).fetchSockets();
      const recipientInRoom = roomSockets.some(s => s.user && s.user.id === recipientId);
      if (recipientInRoom) socket.emit("delivered", { msgId: msg._id });
    } catch (err) {
      console.error("sendDM error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("markRead", async ({ roomId, contactId }) => {
    if (!socket.user) return;
    try {
      await DirectMessage.updateMany(
        { sender: contactId, recipient: socket.user.id, readStatus: false },
        { readStatus: true }
      );
      io.to(roomId).emit("messagesRead", { contactId: socket.user.id });
      io.to(`user:${socket.user.id}`).emit("dmInboxUpdate", { peerId: String(contactId), resetUnread: true });
    } catch (err) {
      console.error("markRead error:", err);
    }
  });

  socket.on("typing", ({ roomId }) => {
    if (socket.user) socket.to(roomId).emit("typing", { userId: socket.user.id });
  });

  socket.on("stopTyping", ({ roomId }) => {
    if (socket.user) socket.to(roomId).emit("stopTyping", { userId: socket.user.id });
  });

  // ── Announcements ─────────────────────────────────────────────────────────

  socket.on("joinAnnouncements", () => socket.join("announcements"));

  // ── Meeting Room (WebRTC Signaling) ───────────────────────────────────────

  socket.on("joinMeetingRoom", async ({ sessionId }) => {
    socket.join(sessionId);
    socket.meetingSessionId = sessionId;

    const roomSockets = await io.in(sessionId).fetchSockets();
    const existing = roomSockets
      .filter(s => s.id !== socket.id)
      .map(s => ({ socketId: s.id, userId: s.user?.id, name: s.user?.name || s.user?.email || "Participant", role: s.user?.role || "student" }));

    socket.emit("existingParticipants", existing);
    socket.to(sessionId).emit("participantJoined", {
      socketId: socket.id, userId: socket.user?.id,
      name: socket.user?.name || socket.user?.email || "Participant", role: socket.user?.role
    });
  });

  socket.on("leaveMeetingRoom", ({ sessionId }) => {
    socket.leave(sessionId);
    socket.meetingSessionId = null;
    io.to(sessionId).emit("participantLeft", {
      socketId: socket.id, userId: socket.user?.id,
      name: socket.user?.name || socket.user?.email, role: socket.user?.role
    });
  });

  socket.on("offer",        ({ targetSocketId, sdp }) => io.to(targetSocketId).emit("offer",        { fromSocketId: socket.id, sdp }));
  socket.on("answer",       ({ targetSocketId, sdp }) => io.to(targetSocketId).emit("answer",       { fromSocketId: socket.id, sdp }));
  socket.on("iceCandidate", ({ targetSocketId, candidate }) => io.to(targetSocketId).emit("iceCandidate", { fromSocketId: socket.id, candidate }));

  socket.on("meetingChat", ({ sessionId, text }) => {
    if (!socket.user || !sessionId || !String(text || "").trim()) return;
    io.to(sessionId).emit("meetingChat", {
      socketId: socket.id,
      name: socket.user.name || socket.user.email || "Participant",
      text: String(text).trim().slice(0, 4000),
      at: Date.now()
    });
  });

  socket.on("meetingMediaState", ({ sessionId, audioEnabled, videoEnabled }) => {
    if (sessionId) socket.to(sessionId).emit("meetingMediaState", { socketId: socket.id, audioEnabled: !!audioEnabled, videoEnabled: !!videoEnabled });
  });

  socket.on("meetingRaiseHand", ({ sessionId }) => {
    if (socket.user && sessionId)
      io.to(sessionId).emit("meetingRaiseHand", { socketId: socket.id, name: socket.user.name || socket.user.email || "Participant" });
  });

  socket.on("meetingLowerHand", ({ sessionId }) => {
    if (sessionId) socket.to(sessionId).emit("meetingLowerHand", { socketId: socket.id });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    if (!socket.user) return;

    presenceService.userDisconnected(socket.user.id, socket.id, io);

    // End meeting if faculty disconnects mid-session
    if (socket.user.role === "faculty" && socket.meetingSessionId) {
      try {
        const liveClass = await LiveClass.findByIdAndUpdate(
          socket.meetingSessionId,
          { isLive: false, endedAt: new Date() },
          { new: true }
        );
        if (liveClass) io.to(socket.meetingSessionId).emit("meetingEnded", { sessionId: socket.meetingSessionId });
      } catch (err) {
        console.error("Error ending meeting on disconnect:", err);
      }
    }
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
