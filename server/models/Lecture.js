const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String },
    faculty: { type: String },
    type: { type: String }, // pdf / ppt / video
    fileUrl: { type: String, required: true }, // ✅ FIXED
    course: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lecture", lectureSchema);
