const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");

router.post("/", async (req, res) => {
  try {
    const announcement = await Announcement.create(req.body);
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch announcements" });
  }
});

router.get("/faculty/:name", async (req, res) => {
  try {
    const announcements = await Announcement.find({
      faculty: { $regex: new RegExp("^" + req.params.name + "$", "i") }
    }).sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch faculty announcements" });
  }
});

router.put("/:id", async (req, res) => {
  const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, announcement: updated });
});

router.delete("/:id", async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
