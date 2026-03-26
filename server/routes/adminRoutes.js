const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Attendance = require("../models/Attendance");
const Announcement = require("../models/Announcement");

/* =====================================
   GET ALL USERS (ADMIN)
   GET /api/admin/users
===================================== */
router.get(
  "/users",
  auth,
  role(["admin"]),
  async (req, res) => {
    try {
      const users = await User.find()
        .select("name email role isApproved course createdAt")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        users
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch users"
      });
    }
  }
);

/* =====================================
   GET ADMIN STATS
   GET /api/admin/stats
===================================== */
router.get(
  "/stats",
  auth,
  role(["admin"]),
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalStudents,
        totalFaculty,
        totalAssignments,
        totalAttendanceRecords,
        totalAnnouncements,
        pendingApprovals
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "faculty" }),
        Assignment.countDocuments(),
        Attendance.countDocuments(),
        Announcement.countDocuments(),
        User.countDocuments({ role: "student", isApproved: false })
      ]);

      res.json({
        success: true,
        totalUsers,
        totalStudents,
        totalFaculty,
        totalAssignments,
        totalAttendanceRecords,
        totalAnnouncements,
        pendingApprovals
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch stats"
      });
    }
  }
);

/* =====================================
   APPROVE USER
   PUT /api/admin/approve/:id
===================================== */
router.put(
  "/approve/:id",
  auth,
  role(["admin"]),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isApproved: true },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to approve user" });
    }
  }
);

/* =====================================
   CREATE USER
   POST /api/admin/create-user
===================================== */
router.post(
  "/create-user",
  auth,
  role(["admin"]),
  async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.json({ message: "User created successfully" });
  }
);

/* =====================================
   UPDATE ROLE
   PUT /api/admin/update-role/:id
===================================== */
router.put(
  "/update-role/:id",
  auth,
  role(["admin"]),
  async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, {
      role: req.body.role
    });
    res.json({ message: "Role updated" });
  }
);

/* =====================================
   DELETE USER
   DELETE /api/admin/users/:id
===================================== */
router.delete(
  "/users/:id",
  auth,
  role(["admin"]),
  async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  }
);

module.exports = router;
