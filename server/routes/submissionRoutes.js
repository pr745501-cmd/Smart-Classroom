const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');

// STUDENT → SUBMIT ASSIGNMENT
router.post('/submit', async (req, res) => {
  try {
    const submission = new Submission(req.body);
    await submission.save();
    res.json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
