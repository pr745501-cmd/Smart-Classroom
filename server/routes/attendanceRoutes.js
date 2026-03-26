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
      const year  = parseInt(req.params.year);
      const month = parseInt(req.params.month); // 1-based

      // Build all days of the requested month as strings to match stored format
      const daysInMonth = new Date(year, month, 0).getDate();

      // Fetch ALL attendance docs for this student, then filter by month in JS
      const allDocs = await Attendance.find({
        "records.studentId": studentId
      }).sort({ date: 1 });

      // Log raw date values to diagnose format
      if (allDocs.length > 0) {
        console.log("📅 Sample date values from DB:", allDocs.slice(0, 3).map(d => d.date));
      }

      // Helper: parse any date string safely, return { year, month, day } in local-like terms
      function parseDate(raw) {
        if (!raw) return null;
        // Already ISO YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
          const parts = raw.substring(0, 10).split('-');
          return { year: +parts[0], month: +parts[1], day: +parts[2] };
        }
        // DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
          const parts = raw.split('/');
          return { year: +parts[2], month: +parts[1], day: +parts[0] };
        }
        // MM/DD/YYYY
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(raw)) {
          const parts = raw.split('-');
          return { year: +parts[2], month: +parts[0], day: +parts[1] };
        }
        // Fallback: let JS parse but extract UTC parts to avoid timezone shift
        const d = new Date(raw);
        if (isNaN(d.getTime())) return null;
        return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
      }

      // Filter docs for requested year/month
      const monthDocs = allDocs.filter(doc => {
        const p = parseDate(doc.date);
        if (!p) return false;
        return p.year === year && p.month === month;
      });

      // Build a map of day -> status from actual records
      const recordMap = {};
      monthDocs.forEach(doc => {
        const record = doc.records.find(r => r.studentId.toString() === studentId);
        const p = parseDate(doc.date);
        if (p) recordMap[p.day] = record?.status || "absent";
      });

      // Return one entry per day of the month
      const data = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        return {
          date: dateStr,
          day,
          status: recordMap[day] || "none"   // "none" = no class that day
        };
      });

      res.json({ success: true, data });

    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to fetch monthly attendance" });
    }
  }
);

/* =====================================
   ADMIN: GET ALL ATTENDANCE
   GET /api/attendance/all
===================================== */
router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const attendance = await Attendance.find().sort({ date: -1 });
      res.json({ success: true, attendance });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to fetch attendance" });
    }
  }
);

module.exports = router;
