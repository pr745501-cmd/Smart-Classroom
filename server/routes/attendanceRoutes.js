const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// POST /api/attendance — faculty marks attendance (once per day)
router.post("/", auth, role(["faculty"]), async (req, res) => {
  try {
    const { date, faculty, course, records, targetYear, targetSemester } = req.body;

    if (!date || !faculty || !course || !records?.length) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (!targetYear || !targetSemester) {
      return res.status(400).json({ success: false, message: "Target year and semester are required" });
    }

    const existing = await Attendance.findOne({ date, faculty, course, targetYear, targetSemester });
    if (existing) return res.status(400).json({ success: false, message: "Attendance already marked for today" });

    const attendance = await Attendance.create({ date, faculty, course, targetYear, targetSemester, records });
    res.status(201).json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/my — student's own attendance list
router.get("/my", auth, role(["student"]), async (req, res) => {
  try {
    if (!req.user.year || req.user.semester == null) {
      return res.json({ success: true, attendance: [] });
    }

    const docs = await Attendance.find({
      "records.studentId": req.user.id,
      targetYear: req.user.year,
      targetSemester: req.user.semester
    }).sort({ date: -1 });

    const attendance = docs.map(doc => {
      const record = doc.records.find(r => r.studentId.toString() === req.user.id);
      return { date: doc.date, faculty: doc.faculty, course: doc.course, status: record?.status || "absent" };
    });

    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch attendance" });
  }
});

// GET /api/attendance/monthly/:year/:month — student's monthly chart data
router.get("/monthly/:year/:month", auth, role(["student"]), async (req, res) => {
  try {
    const year  = parseInt(req.params.year);
    const month = parseInt(req.params.month); // 1-based
    const daysInMonth = new Date(year, month, 0).getDate();

    const allDocs = await Attendance.find({ "records.studentId": req.user.id }).sort({ date: 1 });

    // Parse any date format into { year, month, day }
    function parseDate(raw) {
      if (!raw) return null;
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        const [y, m, d] = raw.substring(0, 10).split("-");
        return { year: +y, month: +m, day: +d };
      }
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
        const [d, m, y] = raw.split("/");
        return { year: +y, month: +m, day: +d };
      }
      const d = new Date(raw);
      if (isNaN(d.getTime())) return null;
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    }

    // Build a day → status map for the requested month
    const recordMap = {};
    allDocs.forEach(doc => {
      const p = parseDate(doc.date);
      if (!p || p.year !== year || p.month !== month) return;
      const record = doc.records.find(r => r.studentId.toString() === req.user.id);
      recordMap[p.day] = record?.status || "absent";
    });

    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return {
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        day,
        status: recordMap[day] || "none" // "none" = no class that day
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch monthly attendance" });
  }
});

// GET /api/attendance/all — admin sees all attendance records
router.get("/all", auth, role(["admin"]), async (req, res) => {
  try {
    const attendance = await Attendance.find().sort({ date: -1 });
    res.json({ success: true, attendance });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch attendance" });
  }
});

module.exports = router;
