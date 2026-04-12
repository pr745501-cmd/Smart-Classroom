const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// GET /api/students/enrolled — faculty gets approved students
router.get("/enrolled", auth, role(["faculty"]), async (req, res) => {
  try {
    const filter = {
      role: "student",
      $or: [{ isApproved: true }, { isApproved: { $exists: false } }]
    };
    if (req.query.year) filter.year = req.query.year;
    if (req.query.semester) filter.semester = Number(req.query.semester);

    const students = await User.find(filter)
      .select("_id name email course year semester createdAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, students });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
});

// GET /api/students/pending — faculty gets students awaiting approval
router.get("/pending", auth, role(["faculty"]), async (req, res) => {
  try {
    const students = await User.find({ role: "student", isApproved: false })
      .select("_id name email course year semester createdAt")
      .sort({ createdAt: -1 });
    res.json({ success: true, students });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch pending students" });
  }
});

// PUT /api/students/approve/:id — faculty approves a student
router.put("/approve/:id", auth, role(["faculty"]), async (req, res) => {
  try {
    const student = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true })
      .select("_id name email course isApproved");
    res.json({ success: true, message: "Student approved successfully", student });
  } catch {
    res.status(500).json({ success: false, message: "Failed to approve student" });
  }
});

module.exports = router;
