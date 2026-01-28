const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema({
  title: String,
  meetingLink: String,
  facultyName: String,
  isLive: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LiveClass", liveClassSchema);
