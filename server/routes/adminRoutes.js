const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Attendance = require("../models/Attendance");
const Announcement = require("../models/Announcement");

// GET /api/admin/users
router.get("/users", auth, role(["admin"]), async (req, res) => {
  try {
    const filter = req.query.year ? { year: req.query.year } : {};
    const users = await User.find(filter)
      .select("name email role isApproved course year semester createdAt")
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// GET /api/admin/stats
router.get("/stats", auth, role(["admin"]), async (req, res) => {
  try {
    const [totalUsers, totalStudents, totalFaculty, totalAssignments, totalAttendanceRecords, totalAnnouncements, pendingApprovals] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "faculty" }),
        Assignment.countDocuments(),
        Attendance.countDocuments(),
        Announcement.countDocuments(),
        User.countDocuments({ role: "student", isApproved: false })
      ]);

    res.json({ success: true, totalUsers, totalStudents, totalFaculty, totalAssignments, totalAttendanceRecords, totalAnnouncements, pendingApprovals });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

// PUT /api/admin/approve/:id
router.put("/approve/:id", auth, role(["admin"]), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: "Failed to approve user" });
  }
});

// POST /api/admin/create-user
router.post("/create-user", auth, role(["admin"]), async (req, res) => {
  try {
    const user = await new User(req.body).save();
    res.json({ message: "User created successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/update-role/:id
router.put("/update-role/:id", auth, role(["admin"]), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { role: req.body.role });
    res.json({ message: "Role updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", auth, role(["admin"]), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
