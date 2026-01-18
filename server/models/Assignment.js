const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    fileUrl: { type: String },
    faculty: { type: String, required: true },
    course: { type: String, default: "BCA" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
