const express = require("express");
const router = express.Router();
const ChatMessage = require("../models/ChatMessage");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const chatController = require("../controllers/chatController");

// GET /api/chat/faculty — faculty list for students to DM
router.get("/faculty", auth, role(["student", "admin"]), chatController.getFacultyList);

// GET /api/chat/contacts — student contacts for faculty
router.get("/contacts", auth, role(["faculty"]), chatController.getStudentContacts);

// GET /api/chat/conversation/:contactId — DM history
router.get("/conversation/:contactId", auth, chatController.getConversation);

// GET /api/chat/:lectureId — lecture chat history
router.get("/:lectureId", async (req, res) => {
  try {
    const messages = await ChatMessage.find({ lectureId: req.params.lectureId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to load chat messages" });
  }
});

module.exports = router;
