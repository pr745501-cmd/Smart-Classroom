const express = require("express");
const router = express.Router();
const Lecture = require("../models/Lecture");

router.post("/", async (req, res) => {
  try {
    const lecture = await Lecture.create(req.body);
    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const lectures = await Lecture.find().sort({ createdAt: -1 });
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
