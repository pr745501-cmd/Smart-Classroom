const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const Lecture = require("../models/Lecture");
const Assignment = require("../models/Assignment");

// ✅ Upload Lecture
router.post(
  "/lecture",
  auth,
  role(["faculty"]),
  async (req, res) => {
    const lecture = new Lecture({
      title: req.body.title,
      description: req.body.description,
      videoUrl: req.body.videoUrl,
      createdBy: req.user.id
    });

    await lecture.save();
    res.json({ message: "Lecture uploaded successfully" });
  }
);

// ✅ Create Assignment
router.post(
  "/assignment",
  auth,
  role(["faculty"]),
  async (req, res) => {
    const assignment = new Assignment({
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      createdBy: req.user.id
    });

    await assignment.save();
    res.json({ message: "Assignment created successfully" });
  }
);

module.exports = router;
