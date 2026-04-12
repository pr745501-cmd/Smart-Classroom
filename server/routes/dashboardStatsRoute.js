const express = require("express");
const router = express.Router();
const Lecture = require("../models/Lecture");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Attendance = require("../models/Attendance");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// GET /api/dashboard/stats — student dashboard summary
router.get("/stats", auth, role(["student"]), async (req, res) => {
  try {
    const studentId = req.user.id;
    const yearFilter = req.user.year && req.user.semester
      ? { targetYear: req.user.year, targetSemester: req.user.semester }
      : {};

    // 1. Count distinct subjects from lectures
    const lectures = await Lecture.find(yearFilter).select("subject");
    const subjectCount = new Set(lectures.map(l => l.subject).filter(Boolean)).size;

    // 2. Count pending assignments (due in future, not yet submitted)
    const upcomingAssignments = await Assignment.find({ dueDate: { $gte: new Date() } }).select("_id");
    const upcomingIds = upcomingAssignments.map(a => a._id);

    const submitted = await Submission.find({ student: studentId, assignment: { $in: upcomingIds } }).select("assignment");
    const submittedIds = new Set(submitted.map(s => s.assignment.toString()));
    const pendingCount = upcomingIds.filter(id => !submittedIds.has(id.toString())).length;

    // 3. Calculate attendance percentage
    const attendanceDocs = await Attendance.find({ "records.studentId": studentId });
    const total = attendanceDocs.length;
    const present = attendanceDocs.filter(doc => {
      const record = doc.records.find(r => r.studentId.toString() === studentId);
      return record?.status === "present";
    }).length;

    res.json({
      success: true,
      stats: {
        subjects: subjectCount,
        pending: pendingCount,
        attendance: total > 0 ? Math.round((present / total) * 100) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
