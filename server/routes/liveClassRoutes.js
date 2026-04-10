const express = require("express");
const crypto = require("crypto");
const LiveClass = require("../models/LiveClass");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Generate a unique 6-char meeting code
async function generateMeetingCode() {
  for (let i = 0; i < 5; i++) {
    const bytes = crypto.randomBytes(6);
    const code = Array.from(bytes).map(b => CHARSET[b % CHARSET.length]).join("");
    const exists = await LiveClass.findOne({ meetingCode: code, isLive: true });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique meeting code");
}

module.exports = (io) => {
  const router = express.Router();

  // POST /api/live-class/start — faculty starts a meeting
  router.post("/start", auth, role(["faculty"]), async (req, res) => {
    try {
      const existing = await LiveClass.findOne({ facultyId: req.user.id, isLive: true });
      if (existing) return res.status(409).json({ message: "You already have an active meeting" });

      const facultyUser = await User.findById(req.user.id).select("name email").lean();
      const facultyName = facultyUser?.name || facultyUser?.email || "Faculty";
      const meetingCode = await generateMeetingCode();

      const liveClass = await LiveClass.create({
        title: req.body.title,
        facultyName,
        facultyId: req.user.id,
        meetingCode,
        isLive: true
      });

      const sessionId = liveClass._id.toString();
      io.emit("meetingStarted", { sessionId, title: liveClass.title, meetingCode, facultyName });

      res.json({ meetingCode, title: liveClass.title, sessionId, facultyName });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/live-class/join — student joins with meeting code
  router.post("/join", auth, async (req, res) => {
    try {
      const liveClass = await LiveClass.findOne({ meetingCode: req.body.meetingCode, isLive: true });
      if (!liveClass) return res.status(404).json({ message: "Invalid or expired meeting code" });

      const joiningUser = await User.findById(req.user.id).select("name email").lean();
      const participantName = joiningUser?.name || joiningUser?.email || "Student";

      liveClass.participants.push({ userId: req.user.id, name: participantName, role: req.user.role, joinedAt: new Date() });
      await liveClass.save();

      res.json({ sessionId: liveClass._id.toString(), title: liveClass.title, meetingCode: liveClass.meetingCode, facultyName: liveClass.facultyName });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // DELETE /api/live-class/end — faculty ends their active meeting
  router.delete("/end", auth, role(["faculty"]), async (req, res) => {
    try {
      const liveClass = await LiveClass.findOne({ facultyId: req.user.id, isLive: true });
      if (!liveClass) return res.status(404).json({ message: "No active meeting found" });

      liveClass.isLive = false;
      liveClass.endedAt = new Date();
      await liveClass.save();

      io.to(liveClass._id.toString()).emit("meetingEnded", { sessionId: liveClass._id.toString() });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // DELETE /api/live-class/force-end — force-end any stuck active meeting
  router.delete("/force-end", auth, role(["faculty"]), async (req, res) => {
    try {
      const result = await LiveClass.updateMany(
        { facultyId: req.user.id, isLive: true },
        { isLive: false, endedAt: new Date() }
      );
      res.json({ success: true, ended: result.modifiedCount });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/live-class — get current active meeting (if any)
  router.get("/", auth, async (req, res) => {
    try {
      const liveClass = await LiveClass.findOne({ isLive: true });
      res.json(liveClass || null);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
