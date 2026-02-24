const express = require("express");
const router = express.Router();

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/* =====================================
   FACULTY: GET APPROVED STUDENTS
   GET /api/students/enrolled
===================================== */
router.get(
  "/enrolled",
  authMiddleware,
  roleMiddleware(["faculty"]),
  async (req, res) => {
    try {
     const students = await User.find({
  role: "student",
  $or: [
    { isApproved: true },
    { isApproved: { $exists: false } }
  ]
})
        .select("_id name email course createdAt")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        students
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch students"
      });
    }
  }
);

/* =====================================
   FACULTY: GET PENDING STUDENTS
   GET /api/students/pending
===================================== */
router.get(
  "/pending",
  authMiddleware,
  roleMiddleware(["faculty"]),
  async (req, res) => {
    try {
      const students = await User.find({
        role: "student",
        isApproved: false
      })
        .select("_id name email course createdAt")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        students
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch pending students"
      });
    }
  }
);

/* =====================================
   FACULTY: APPROVE STUDENT
   PUT /api/students/approve/:id
===================================== */
router.put(
  "/approve/:id",
  authMiddleware,
  roleMiddleware(["faculty"]),
  async (req, res) => {
    try {
      const student = await User.findByIdAndUpdate(
        req.params.id,
        { isApproved: true },
        { new: true }
      ).select("_id name email course isApproved");

      res.json({
        success: true,
        message: "Student approved successfully",
        student
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to approve student"
      });
    }
  }
);

/* =====================================
   STUDENT: GET OWN ATTENDANCE
===================================== */
router.get("/student/:id", async (req, res) => {
  try {
    const studentId = req.params.id;

    const attendance = await Attendance.find({
      "records.studentId": studentId
    }).sort({ date: -1 });

    const result = attendance.map(a => {
      const record = a.records.find(
        r => r.studentId.toString() === studentId
      );

      return {
        date: a.date,
        faculty: a.faculty,
        course: a.course,
        status: record?.status || "absent"
      };
    });

    res.json({
      success: true,
      attendance: result
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance"
    });
  }
});

module.exports = router;