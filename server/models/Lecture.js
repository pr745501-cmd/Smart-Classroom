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
  },
  targetYear: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year'],
    required: true
  },
  targetSemester: {
    type: Number,
    min: 1,
    max: 6,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Lecture", lectureSchema);
