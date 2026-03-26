const User = require('../models/User');
const DirectMessage = require('../models/DirectMessage');

// GET /api/chat/faculty
// Returns all approved faculty with last message preview and unread count
exports.getFacultyList = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const facultyList = await User.find(
      { role: 'faculty', isApproved: true },
      'name isOnline lastSeen'
    ).lean();

    const results = await Promise.all(
      facultyList.map(async (faculty) => {
        const facultyId = faculty._id;

        // Most recent DM between current user and this faculty
        const lastMsg = await DirectMessage.findOne({
          $or: [
            { sender: currentUserId, recipient: facultyId },
            { sender: facultyId, recipient: currentUserId }
          ]
        })
          .sort({ timestamp: -1 })
          .select('text timestamp')
          .lean();

        // Unread messages sent by this faculty to current user
        const unreadCount = await DirectMessage.countDocuments({
          sender: facultyId,
          recipient: currentUserId,
          readStatus: false
        });

        return {
          _id: faculty._id,
          name: faculty.name,
          isOnline: faculty.isOnline,
          lastSeen: faculty.lastSeen,
          lastMessage: lastMsg
            ? { text: lastMsg.text, timestamp: lastMsg.timestamp }
            : null,
          unreadCount
        };
      })
    );

    // Sort: those with lastMessage by timestamp desc first, then alphabetically by name
    results.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.name.localeCompare(b.name);
    });

    return res.json(results);
  } catch (err) {
    console.error('getFacultyList error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/chat/contacts
// Returns students who have exchanged DMs with the current faculty user
exports.getStudentContacts = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Find all distinct student IDs who have exchanged DMs with this user
    const sentMessages = await DirectMessage.distinct('recipient', {
      sender: currentUserId
    });
    const receivedMessages = await DirectMessage.distinct('sender', {
      recipient: currentUserId
    });

    // Merge and deduplicate
    const allContactIds = [
      ...new Set([
        ...sentMessages.map(String),
        ...receivedMessages.map(String)
      ])
    ];

    // Fetch only students from those IDs
    const students = await User.find(
      { _id: { $in: allContactIds }, role: 'student' },
      'name isOnline lastSeen'
    ).lean();

    const results = await Promise.all(
      students.map(async (student) => {
        const studentId = student._id;

        const lastMsg = await DirectMessage.findOne({
          $or: [
            { sender: currentUserId, recipient: studentId },
            { sender: studentId, recipient: currentUserId }
          ]
        })
          .sort({ timestamp: -1 })
          .select('text timestamp')
          .lean();

        const unreadCount = await DirectMessage.countDocuments({
          sender: studentId,
          recipient: currentUserId,
          readStatus: false
        });

        return {
          _id: student._id,
          name: student.name,
          isOnline: student.isOnline,
          lastSeen: student.lastSeen,
          lastMessage: lastMsg
            ? { text: lastMsg.text, timestamp: lastMsg.timestamp }
            : null,
          unreadCount
        };
      })
    );

    // Sort by lastMessage.timestamp desc
    results.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return 0;
    });

    return res.json(results);
  } catch (err) {
    console.error('getStudentContacts error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/chat/conversation/:contactId
// Returns up to 100 DMs between current user and contactId, asc order
exports.getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { contactId } = req.params;
    const { before } = req.query;

    const filter = {
      $or: [
        { sender: currentUserId, recipient: contactId },
        { sender: contactId, recipient: currentUserId }
      ]
    };

    if (before) {
      filter.timestamp = { $lt: new Date(before) };
    }

    const messages = await DirectMessage.find(filter)
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();

    return res.json(messages);
  } catch (err) {
    console.error('getConversation error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
