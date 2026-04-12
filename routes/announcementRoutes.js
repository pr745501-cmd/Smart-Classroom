const express = require("express");
const Announcement = require("../models/Announcement");
const auth = require("../middleware/authMiddleware");

module.exports = (io) => {
  const router = express.Router();

  // POST /api/announcements
  router.post("/", async (req, res) => {
    try {
      const announcement = await Announcement.create(req.body);
      io.to("announcements").emit("announcementCreated", announcement);
      res.status(201).json({ success: true, announcement });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // GET /api/announcements
  router.get("/", auth, async (req, res) => {
    try {
      // Students only see announcements for their year and semester
      const query = req.user.role === "student"
        ? { targetYear: req.user.year, targetSemester: req.user.semester }
        : {};

      if (req.user.role === "student" && (!req.user.year || req.user.semester == null)) {
        return res.json({ success: true, announcements: [] });
      }

      const announcements = await Announcement.find(query).sort({ createdAt: -1 });
      res.json({ success: true, announcements });
    } catch {
      res.status(500).json({ success: false, message: "Failed to fetch announcements" });
    }
  });

  // GET /api/announcements/faculty/:name
  router.get("/faculty/:name", async (req, res) => {
    try {
      const announcements = await Announcement.find({
        faculty: { $regex: new RegExp(`^${req.params.name}$`, "i") }
      }).sort({ createdAt: -1 });
      res.json({ success: true, announcements });
    } catch {
      res.status(500).json({ success: false, message: "Failed to fetch faculty announcements" });
    }
  });

  // PUT /api/announcements/:id
  router.put("/:id", async (req, res) => {
    try {
      const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
      io.to("announcements").emit("announcementUpdated", updated);
      res.json({ success: true, announcement: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // DELETE /api/announcements/:id
  router.delete("/:id", async (req, res) => {
    try {
      await Announcement.findByIdAndDelete(req.params.id);
      io.to("announcements").emit("announcementDeleted", { _id: req.params.id });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
};
