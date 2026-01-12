const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * CREATE announcement (ONLY teacher/admin)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, message } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      postedBy: req.user.id,
      role: req.user.role
    });

    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET announcements (ALL users)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
