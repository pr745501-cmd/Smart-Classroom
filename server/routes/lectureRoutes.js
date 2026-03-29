const express = require("express");
const router = express.Router();
const Lecture = require("../models/Lecture");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", async (req, res) => {
  try {
    const lecture = await Lecture.create(req.body);
    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      if (!req.user.year || req.user.semester == null) {
        console.warn(`Student ${req.user.id} has no year/semester in token`);
        return res.json({ success: true, lectures: [] });
      }
      query = { targetYear: req.user.year, targetSemester: req.user.semester };
    }
    const lectures = await Lecture.find(query).sort({ createdAt: -1 });
    res.json({ success: true, lectures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/faculty/:name", async (req, res) => {
  try {
    const lectures = await Lecture.find({
      faculty: { $regex: new RegExp("^" + req.params.name + "$", "i") }
    }).sort({ createdAt: -1 });
    res.json({ success: true, lectures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Lecture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, lecture: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Lecture.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
