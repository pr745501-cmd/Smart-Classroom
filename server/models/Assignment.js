const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: Date,
  fileUrl: String
}, { timestamps: true });

module.exports = mongoose.model("Assignment", assignmentSchema);
