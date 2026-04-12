const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true
    },

    faculty: {
      type: String,
      required: true
    },

    course: {
      type: String,
      required: true
    },

    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId, // ✅ MUST be ObjectId
          ref: "User",
          required: true
        },
        name: {
          type: String,
          required: true
        },
        status: {
          type: String,
          enum: ["present", "absent"],
          required: true
        }
      }
    ],
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

module.exports = mongoose.model("Attendance", attendanceSchema);
