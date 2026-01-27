const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: "pdf"
  },
  fileUrl: {
    type: String,
    required: true
  },
  faculty: {
    type: String,
    required: true
  },
  course: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Lecture", lectureSchema);
