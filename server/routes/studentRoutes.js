const express = require("express");
const router = express.Router();

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/* =====================================
   FACULTY: GET ENROLLED STUDENTS
   GET /api/student/enrolled
===================================== */
router.get(
  "/enrolled",
  authMiddleware,
  roleMiddleware(["faculty"]),
  async (req, res) => {
    try {
      const students = await User.find({ role: "student" })
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
   STUDENT: GET OWN ATTENDANCE
   URL: /api/attendance/student/:id
===================================== */
router.get("/student/:id", async (req, res) => {
  try {
    const studentId = req.params.id;

    const attendance = await Attendance.find({
      "records.studentId": studentId
    }).sort({ date: -1 });

    // Extract only this student's record
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
