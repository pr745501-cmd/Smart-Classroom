const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: String,
  studentName: String,
  subject: String,
  date: Date,
  status: String, // Present / Absent
  faculty: String
});

module.exports = mongoose.model("Attendance", attendanceSchema);
