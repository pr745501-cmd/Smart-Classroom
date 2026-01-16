const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    faculty: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
