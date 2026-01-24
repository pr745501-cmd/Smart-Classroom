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
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
