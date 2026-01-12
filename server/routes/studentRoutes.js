const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const Lecture = require("../models/Lecture");
const Assignment = require("../models/Assignment");

// ✅ View Lectures
router.get(
  "/lectures",
  auth,
  role(["student"]),
  async (req, res) => {
    const lectures = await Lecture.find();
    res.json(lectures);
  }
);

// ✅ View Assignments
router.get(
  "/assignments",
  auth,
  role(["student"]),
  async (req, res) => {
    const assignments = await Assignment.find();
    res.json(assignments);
  }
);

module.exports = router;
