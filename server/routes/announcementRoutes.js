const express = require("express");
const Announcement = require("../models/Announcement");

module.exports = (io) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const announcement = await Announcement.create(req.body);
      // Broadcast to all users in announcements room
      io.to("announcements").emit("announcementCreated", announcement);
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
    io.to("announcements").emit("announcementUpdated", updated);
    res.json({ success: true, announcement: updated });
  });

  router.delete("/:id", async (req, res) => {
    await Announcement.findByIdAndDelete(req.params.id);
    io.to("announcements").emit("announcementDeleted", { _id: req.params.id });
    res.json({ success: true });
  });

  return router;
};
