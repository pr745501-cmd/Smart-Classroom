const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    fileUrl: { type: String },
    faculty: { type: String, required: true },
    course: { type: String, default: "BCA" },
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

module.exports = mongoose.model("Assignment", assignmentSchema);
