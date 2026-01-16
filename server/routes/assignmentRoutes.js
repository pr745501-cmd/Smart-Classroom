const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");

/* FACULTY: CREATE ASSIGNMENT */
router.post("/", async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save();

    res.status(201).json({
      success: true,
      assignment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* STUDENT: GET ALL ASSIGNMENTS */
router.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
