const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({

  lectureId: {
    type: String,
    required: true
  },

  senderName: String,

  senderRole: String,

  message: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("ChatMessage", chatSchema);