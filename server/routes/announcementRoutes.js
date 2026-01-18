const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");

/* ===============================
   FACULTY: CREATE ANNOUNCEMENT
   (VISIBLE TO ALL)
================================ */
router.post("/", async (req, res) => {
  try {
    const announcement = await Announcement.create(req.body);

    res.status(201).json({
      success: true,
      announcement
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

/* ===============================
   STUDENT: GET ALL ANNOUNCEMENTS
================================ */
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      announcements
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements"
    });
  }
});

/* ===============================
   FACULTY: GET OWN ANNOUNCEMENTS
================================ */
router.get("/faculty/:name", async (req, res) => {
  try {
    const announcements = await Announcement.find({
      faculty: req.params.name
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      announcements
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty announcements"
    });
  }
});

module.exports = router;
