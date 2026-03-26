const express = require("express");
const router = express.Router();
const ChatMessage = require("../models/ChatMessage");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const chatController = require("../controllers/chatController");

/* ================= DM ROUTES ================= */

router.get("/faculty", authMiddleware, roleMiddleware(["student", "admin"]), chatController.getFacultyList);

router.get("/contacts", authMiddleware, roleMiddleware(["faculty"]), chatController.getStudentContacts);

router.get("/conversation/:contactId", authMiddleware, chatController.getConversation);

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