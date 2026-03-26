const express = require("express");
const router = express.Router();

const Lecture = require("../models/Lecture");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Attendance = require("../models/Attendance");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/**
 * GET /api/dashboard/stats
 * Returns: subjects count, pending assignments count, attendance %
 */
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware(["student"]),
  async (req, res) => {
    try {
      const studentId = req.user.id;

      // 1. SUBJECTS — distinct subjects from lectures
      const lectures = await Lecture.find().select("subject");
      const subjects = new Set(lectures.map(l => l.subject).filter(Boolean));
      const subjectCount = subjects.size;

      // 2. PENDING ASSIGNMENTS — not yet submitted by this student, due date not passed
      const now = new Date();
      const allAssignments = await Assignment.find({ dueDate: { $gte: now } }).select("_id");
      const assignmentIds = allAssignments.map(a => a._id);

      const submitted = await Submission.find({
        student: studentId,
        assignment: { $in: assignmentIds }
      }).select("assignment");

      const submittedIds = new Set(submitted.map(s => s.assignment.toString()));
      const pendingCount = assignmentIds.filter(id => !submittedIds.has(id.toString())).length;

      // 3. ATTENDANCE % — present / total records for this student
      const attendanceDocs = await Attendance.find({
        "records.studentId": studentId
      });

      const total = attendanceDocs.length;
      const present = attendanceDocs.filter(doc => {
        const record = doc.records.find(r => r.studentId.toString() === studentId);
        return record?.status === "present";
      }).length;

      const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;

      res.json({
        success: true,
        stats: {
          subjects: subjectCount,
          pending: pendingCount,
          attendance: attendancePct
        }
      });

    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
