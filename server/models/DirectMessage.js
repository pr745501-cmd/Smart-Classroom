const mongoose = require("mongoose");

const directMessageSchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true },
  readStatus: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// Compound index for efficient conversation queries
directMessageSchema.index({ sender: 1, recipient: 1, timestamp: 1 });
// Also index the reverse direction
directMessageSchema.index({ recipient: 1, sender: 1, timestamp: 1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
