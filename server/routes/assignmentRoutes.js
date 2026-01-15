const express = require("express");
const router = express.Router();
const multer = require("multer");
const Assignment = require("../models/Assignment");

// 🔹 FILE STORAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ✅ ADD ASSIGNMENT
router.post("/add", upload.single("file"), async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    const assignment = new Assignment({
      title,
      description,
      dueDate,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null
    });

    await assignment.save();

    res.status(201).json({
      success: true,
      assignment
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ GET ASSIGNMENTS
router.get("/", async (req, res) => {
  const assignments = await Assignment.find().sort({ createdAt: -1 });
  res.json({ success: true, assignments });
});

module.exports = router;
