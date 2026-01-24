const express = require("express");
const router = express.Router();

const Attendance = require("../models/Attendance");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/* =====================================
   FACULTY: MARK ATTENDANCE (ONCE / DAY)
   POST /api/attendance
===================================== */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["faculty"]),
  async (req, res) => {
    try {
      const { date, faculty, course, records } = req.body;

      if (!date || !faculty || !course || !records || records.length === 0) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }

      // 🔒 DUPLICATE CHECK
      const existing = await Attendance.findOne({ date, faculty, course });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Attendance already marked for today"
        });
      }

      const attendance = await Attendance.create({
        date,
        faculty,
        course,
        records
      });

      res.status(201).json({
        success: true,
        attendance
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
);

/* =====================================
   STUDENT: GET MY ATTENDANCE (LIST)
   GET /api/attendance/my
===================================== */
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["student"]),
  async (req, res) => {
    try {
      const studentId = req.user.id;

      const attendanceDocs = await Attendance.find({
        "records.studentId": studentId
      }).sort({ date: -1 });

      const myAttendance = attendanceDocs.map(doc => {
        const record = doc.records.find(
          r => r.studentId.toString() === studentId
        );

        return {
          date: doc.date,
          faculty: doc.faculty,
          course: doc.course,
          status: record?.status || "absent"
        };
      });

      res.json({
        success: true,
        attendance: myAttendance
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch attendance"
      });
    }
  }
);

/* =====================================
   STUDENT: MONTHLY ATTENDANCE (CHART)
   GET /api/attendance/monthly/:year/:month
===================================== */
router.get(
  "/monthly/:year/:month",
  authMiddleware,
  roleMiddleware(["student"]),
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const { year, month } = req.params;

      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const docs = await Attendance.find({
        date: { $gte: startDate, $lt: endDate },
        "records.studentId": studentId
      }).sort({ date: 1 });

      const data = docs.map(doc => {
        const record = doc.records.find(
          r => r.studentId.toString() === studentId
        );

        return {
          date: doc.date,
          status: record?.status || "absent"
        };
      });

      res.json({
        success: true,
        data
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch monthly attendance"
      });
    }
  }
);

module.exports = router;
