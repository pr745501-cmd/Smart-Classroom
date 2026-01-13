const express = require('express');
const router = express.Router();
const Lecture = require('../models/Lecture');

/**
 * GET /api/lectures
 * Filters: subject, type, course
 */
router.get('/', async (req, res) => {
  try {
    const filter = {};

    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.course) filter.course = req.query.course;

    const lectures = await Lecture.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      count: lectures.length,
      lectures
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
