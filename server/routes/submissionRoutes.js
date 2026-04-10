const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");

// POST /api/submissions/submit — student submits an assignment
router.post("/submit", async (req, res) => {
  try {
    const submission = await new Submission(req.body).save();
    res.json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
