const express = require("express");
const router = express.Router();

const Assignment = require("../models/Assignment");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/* ===============================
   CREATE ASSIGNMENT (FACULTY)
================================ */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["faculty"]),
  async (req, res) => {
    try {
      const assignment = await Assignment.create(req.body);

      res.status(201).json({
        success: true,
        assignment
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);

/* ===============================
   GET ALL ASSIGNMENTS (STUDENT)
================================ */
router.get("/", authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      if (!req.user.year || req.user.semester == null) {
        console.warn(`Student ${req.user.id} has no year/semester in token`);
        return res.json({ success: true, assignments: [] });
      }
      query = { targetYear: req.user.year, targetSemester: req.user.semester };
    }
    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      assignments
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch assignments"
    });
  }
});

/* ===============================
   GET FACULTY ASSIGNMENTS
================================ */
router.get("/faculty/:name", async (req, res) => {
  try {
    // Case-insensitive match so "Usham" and "usham" both work
    const assignments = await Assignment.find({
      faculty: { $regex: new RegExp(`^${req.params.name}$`, 'i') }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      assignments
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty assignments"
    });
  }
});

/* ===============================
   DELETE ASSIGNMENT (FACULTY)
================================ */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["faculty"]),
  async (req, res) => {
    try {
      await Assignment.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Assignment deleted successfully"
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to delete assignment"
      });
    }
  }
);

/* ===============================
   UPDATE ASSIGNMENT (FACULTY)
================================ */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["faculty"]),
  async (req, res) => {
    try {
      const updated = await Assignment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      res.json({
        success: true,
        assignment: updated
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to update assignment"
      });
    }
  }
);

module.exports = router;