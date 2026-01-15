const express = require('express');
const router = express.Router();
const Lecture = require('../models/Lecture');

// ✅ ADD LECTURE
router.post('/add-multiple', async (req, res) => {
  try {
    await Lecture.insertMany(req.body);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ GET LECTURES
router.get('/', async (req, res) => {
  try {
    const lectures = await Lecture.find(); // ❌ filter hata diya
    res.json({ success: true, lectures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
