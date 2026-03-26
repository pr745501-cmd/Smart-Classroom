const User = require('../models/User');

// In-memory map: userId (string) → Set of socketIds
const onlineSockets = new Map();

module.exports = {
  userConnected(userId, socketId) {
    if (!onlineSockets.has(userId)) onlineSockets.set(userId, new Set());
    onlineSockets.get(userId).add(socketId);
  },

  async userDisconnected(userId, socketId, io) {
    const sockets = onlineSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        // Last socket for this user — mark offline
        onlineSockets.delete(userId);
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
        io.emit('userOffline', { userId, lastSeen: lastSeen.toISOString() });
      }
    }
  },

  async userOnline(userId, io) {
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('userOnline', { userId });
  },

  isOnline(userId) {
    return onlineSockets.has(userId) && onlineSockets.get(userId).size > 0;
  }
};
