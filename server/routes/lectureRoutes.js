const express = require("express");
const router = express.Router();
const Lecture = require("../models/Lecture");

/* =====================================
   FACULTY: CREATE LECTURE (DIRECT SAVE)
===================================== */
router.post("/", async (req, res) => {
  try {
    const lecture = await Lecture.create({
      title: req.body.title,
      subject: req.body.subject,
      type: req.body.type,
      fileUrl: req.body.fileUrl || "",
      faculty: req.body.faculty,
      course: req.body.course || "BCA"
    });

    res.status(201).json({
      success: true,
      lecture
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

/* =====================================
   STUDENT: GET ALL LECTURES
===================================== */
router.get("/", async (req, res) => {
  try {
    const lectures = await Lecture.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      lectures
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch lectures"
    });
  }
});

/* =====================================
   FACULTY: GET OWN LECTURES
===================================== */
router.get("/faculty/:name", async (req, res) => {
  try {
    const lectures = await Lecture.find({
      faculty: req.params.name
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      lectures
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty lectures"
    });
  }
});

module.exports = router;
