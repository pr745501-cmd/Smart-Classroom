const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");

/* ===============================
   CREATE ANNOUNCEMENT
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
   GET ALL (STUDENT)
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
   GET FACULTY ANNOUNCEMENTS
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

/* ===============================
   UPDATE
================================ */
router.put("/:id", async (req, res) => {
  const updated = await Announcement.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({
    success: true,
    announcement: updated
  });
});

/* ===============================
   DELETE
================================ */
router.delete("/:id", async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
