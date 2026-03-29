const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    faculty: { type: String },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
