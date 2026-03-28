const express = require("express");
const crypto = require("crypto");
const LiveClass = require("../models/LiveClass");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;
const MAX_RETRIES = 5;

async function generateMeetingCode() {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const bytes = crypto.randomBytes(CODE_LENGTH);
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CHARSET[bytes[i] % CHARSET.length];
    }
    const existing = await LiveClass.findOne({ meetingCode: code, isLive: true });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique meeting code");
}

module.exports = (io) => {
  const router = express.Router();

  // POST /start
  router.post("/start", authMiddleware, roleMiddleware(["faculty"]), async (req, res) => {
    try {
      const facultyId = req.user.id;
      const User = require("../models/User");
      const facultyUser = await User.findById(facultyId).select("name email").lean();
      const facultyName = facultyUser?.name || facultyUser?.email || "Faculty";

      const existing = await LiveClass.findOne({ facultyId, isLive: true });
      if (existing) {
        return res.status(409).json({ message: "You already have an active meeting" });
      }

      let meetingCode;
      try {
        meetingCode = await generateMeetingCode();
      } catch {
        return res.status(500).json({ message: "Could not generate a unique meeting code" });
      }

      const { title } = req.body;
      const liveClass = await LiveClass.create({
        title,
        facultyName,
        facultyId,
        meetingCode,
        isLive: true
      });

      const sessionId = liveClass._id.toString();

      io.emit("meetingStarted", { sessionId, title, meetingCode, facultyName });

      return res.json({ meetingCode, title, sessionId, facultyName });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // POST /join
  router.post("/join", authMiddleware, async (req, res) => {
    try {
      const { meetingCode } = req.body;
      const liveClass = await LiveClass.findOne({ meetingCode, isLive: true });
      if (!liveClass) {
        return res.status(404).json({ message: "Invalid or expired meeting code" });
      }

      const User = require("../models/User");
      const joiningUser = await User.findById(req.user.id).select("name email").lean();
      const participantName = joiningUser?.name || joiningUser?.email || "Student";

      liveClass.participants.push({
        userId: req.user.id,
        name: participantName,
        role: req.user.role,
        joinedAt: new Date()
      });
      await liveClass.save();

      return res.json({
        sessionId: liveClass._id.toString(),
        title: liveClass.title,
        meetingCode: liveClass.meetingCode,
        facultyName: liveClass.facultyName
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // DELETE /end
  router.delete("/end", authMiddleware, roleMiddleware(["faculty"]), async (req, res) => {
    try {
      const facultyId = req.user.id;
      const liveClass = await LiveClass.findOne({ facultyId, isLive: true });
      if (!liveClass) {
        return res.status(404).json({ message: "No active meeting found" });
      }

      liveClass.isLive = false;
      liveClass.endedAt = new Date();
      await liveClass.save();

      const sessionId = liveClass._id.toString();
      io.to(sessionId).emit("meetingEnded", { sessionId });

      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // DELETE /force-end  — ends any stuck active meeting for this faculty
  router.delete("/force-end", authMiddleware, roleMiddleware(["faculty"]), async (req, res) => {
    try {
      const facultyId = req.user.id;
      const result = await LiveClass.updateMany(
        { facultyId, isLive: true },
        { isLive: false, endedAt: new Date() }
      );
      return res.json({ success: true, ended: result.modifiedCount });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // GET /
  router.get("/", authMiddleware, async (req, res) => {
    try {
      const liveClass = await LiveClass.findOne({ isLive: true });
      return res.json(liveClass || null);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
};
