const User = require("../models/User");

// Tracks which socket IDs belong to each user (one user can have multiple tabs)
const onlineSockets = new Map(); // userId → Set of socketIds

module.exports = {
  userConnected(userId, socketId) {
    if (!onlineSockets.has(userId)) onlineSockets.set(userId, new Set());
    onlineSockets.get(userId).add(socketId);
  },

  async userDisconnected(userId, socketId, io) {
    const sockets = onlineSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);

    // Only mark offline when all tabs/sockets are closed
    if (sockets.size === 0) {
      onlineSockets.delete(userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
      io.emit("userOffline", { userId, lastSeen: lastSeen.toISOString() });
    }
  },

  async userOnline(userId, io) {
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("userOnline", { userId });
  },

  isOnline(userId) {
    return onlineSockets.has(userId) && onlineSockets.get(userId).size > 0;
  }
};
