const express = require("express");
const router = express.Router();
const ChatMessage = require("../models/ChatMessage");

/* ================= GET CHAT HISTORY ================= */

router.get("/:lectureId", async (req, res) => {

  try {

    const messages = await ChatMessage.find({
      lectureId: req.params.lectureId
    }).sort({ createdAt: 1 });

    res.json(messages);

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Failed to load chat messages" });

  }

});

module.exports = router;