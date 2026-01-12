// models/Lecture.js
const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Lecture", lectureSchema);
