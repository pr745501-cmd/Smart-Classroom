const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// POST /api/assignments — faculty creates assignment
router.post("/", auth, role(["faculty"]), async (req, res) => {
  try {
    const assignment = await Assignment.create(req.body);
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/assignments — students see their own, faculty sees all
router.get("/", auth, async (req, res) => {
  try {
    const query = req.user.role === "student"
      ? { targetYear: req.user.year, targetSemester: req.user.semester }
      : {};

    if (req.user.role === "student" && (!req.user.year || req.user.semester == null)) {
      return res.json({ success: true, assignments: [] });
    }

    const assignments = await Assignment.find(query).sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch assignments" });
  }
});

// GET /api/assignments/faculty/:name
router.get("/faculty/:name", async (req, res) => {
  try {
    const assignments = await Assignment.find({
      faculty: { $regex: new RegExp(`^${req.params.name}$`, "i") }
    }).sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch faculty assignments" });
  }
});

// PUT /api/assignments/:id
router.put("/:id", auth, role(["faculty"]), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, assignment });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update assignment" });
  }
});

// DELETE /api/assignments/:id
router.delete("/:id", auth, role(["faculty"]), async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Assignment deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete assignment" });
  }
});

module.exports = router;
