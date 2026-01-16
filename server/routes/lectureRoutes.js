const express = require("express");
const router = express.Router();
const Lecture = require("../models/Lecture");

router.get("/", async (req, res) => {
  try {
    const lectures = await Lecture.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      lectures: lectures   // ✅ must be sent like this
    });

  } catch (err) {
    console.error("Lecture fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load lectures"
    });
  }
});

module.exports = router;
