const User = require("../models/User");
const DirectMessage = require("../models/DirectMessage");

// Helper: get last message and unread count between two users
async function getContactMeta(currentUserId, contactId) {
  const lastMsg = await DirectMessage.findOne({
    $or: [
      { sender: currentUserId, recipient: contactId },
      { sender: contactId, recipient: currentUserId }
    ]
  }).sort({ timestamp: -1 }).select("text timestamp").lean();

  const unreadCount = await DirectMessage.countDocuments({
    sender: contactId,
    recipient: currentUserId,
    readStatus: false
  });

  return {
    lastMessage: lastMsg ? { text: lastMsg.text, timestamp: lastMsg.timestamp } : null,
    unreadCount
  };
}

// Sort contacts: those with messages first (by time), then alphabetically
function sortContacts(list) {
  return list.sort((a, b) => {
    if (a.lastMessage && b.lastMessage) return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });
}

// GET /api/chat/faculty — list of faculty for students to DM
exports.getFacultyList = async (req, res) => {
  try {
    const faculty = await User.find({ role: "faculty", isApproved: true }, "name isOnline lastSeen").lean();

    const results = await Promise.all(faculty.map(async (f) => ({
      _id: f._id, name: f.name, isOnline: f.isOnline, lastSeen: f.lastSeen,
      ...(await getContactMeta(req.user.id, f._id))
    })));

    res.json(sortContacts(results));
  } catch (err) {
    console.error("getFacultyList error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/chat/contacts — list of students who have DM'd this faculty
exports.getStudentContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const sent     = await DirectMessage.distinct("recipient", { sender: userId });
    const received = await DirectMessage.distinct("sender",    { recipient: userId });
    const contactIds = [...new Set([...sent.map(String), ...received.map(String)])];

    const students = await User.find({ _id: { $in: contactIds }, role: "student" }, "name isOnline lastSeen").lean();

    const results = await Promise.all(students.map(async (s) => ({
      _id: s._id, name: s.name, isOnline: s.isOnline, lastSeen: s.lastSeen,
      ...(await getContactMeta(userId, s._id))
    })));

    res.json(sortContacts(results));
  } catch (err) {
    console.error("getStudentContacts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/chat/conversation/:contactId — DM history between current user and contact
exports.getConversation = async (req, res) => {
  try {
    const { contactId } = req.params;
    const filter = {
      $or: [
        { sender: req.user.id, recipient: contactId },
        { sender: contactId, recipient: req.user.id }
      ]
    };

    if (req.query.before) filter.timestamp = { $lt: new Date(req.query.before) };

    const messages = await DirectMessage.find(filter).sort({ timestamp: 1 }).limit(100).lean();
    res.json(messages);
  } catch (err) {
    console.error("getConversation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
