const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");

/* FACULTY: CREATE ANNOUNCEMENT */
router.post("/", async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();

    res.status(201).json({
      success: true,
      announcement
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* STUDENT: GET ANNOUNCEMENTS */
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
