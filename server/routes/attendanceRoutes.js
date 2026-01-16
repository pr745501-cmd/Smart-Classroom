const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");

// FACULTY: ADD ATTENDANCE
router.post("/", async (req, res) => {
  try {
    const attendance = new Attendance(req.body);
    await attendance.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
