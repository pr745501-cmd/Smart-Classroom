const express = require("express");
const router = express.Router();
const Lecture = require("../models/Lecture");
const auth = require("../middleware/authMiddleware");

// POST /api/lectures
router.post("/", async (req, res) => {
  try {
    const lecture = await Lecture.create(req.body);
    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/lectures — students see their year/semester, faculty sees all
router.get("/", auth, async (req, res) => {
  try {
    const query = req.user.role === "student"
      ? { targetYear: req.user.year, targetSemester: req.user.semester }
      : {};

    if (req.user.role === "student" && (!req.user.year || req.user.semester == null)) {
      return res.json({ success: true, lectures: [] });
    }

    const lectures = await Lecture.find(query).sort({ createdAt: -1 });
    res.json({ success: true, lectures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/lectures/faculty/:name
router.get("/faculty/:name", async (req, res) => {
  try {
    const lectures = await Lecture.find({
      faculty: { $regex: new RegExp(`^${req.params.name}$`, "i") }
    }).sort({ createdAt: -1 });
    res.json({ success: true, lectures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/lectures/:id
router.put("/:id", async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/lectures/:id
router.delete("/:id", async (req, res) => {
  try {
    await Lecture.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
