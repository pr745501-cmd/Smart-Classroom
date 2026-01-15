const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");

// ADD ANNOUNCEMENT
router.post("/add", async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET ANNOUNCEMENTS
router.get("/", async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.json({ success: true, announcements });
});

module.exports = router;
