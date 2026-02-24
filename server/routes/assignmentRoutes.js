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
router.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find()
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
    const assignments = await Assignment.find({
      faculty: req.params.name
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