const express = require("express");
const router = express.Router();
const LiveClass = require("../models/LiveClass");

// START CLASS
router.post("/start", async (req, res) => {
  try {
    await LiveClass.deleteMany();   // ❗only one class allowed

    const liveClass = await LiveClass.create(req.body);
    res.json({ success: true, liveClass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET LIVE CLASS (Student)
router.get("/", async (req, res) => {
  const liveClass = await LiveClass.findOne();
  res.json(liveClass);
});

// END CLASS
router.delete("/end", async (req, res) => {
  await LiveClass.deleteMany();
  res.json({ success: true });
});

module.exports = router;
