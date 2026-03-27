const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String },
  role:     { type: String },
  joinedAt: { type: Date, default: Date.now },
  leftAt:   { type: Date }
}, { _id: false });

const liveClassSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  facultyName: { type: String, required: true },
  facultyId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isLive:      { type: Boolean, default: true },
  startedAt:   { type: Date, default: Date.now },
  meetingCode: { type: String, required: true, unique: true, index: true },
  participants: [participantSchema],
  endedAt:     { type: Date }
});

module.exports = mongoose.model("LiveClass", liveClassSchema);
