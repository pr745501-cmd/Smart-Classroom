const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },

    email: { 
      type: String, 
      required: true, 
      unique: true 
    },

    password: { 
      type: String, 
      required: true 
    },

    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      default: "student"
    },

    course: {
      type: String,
      default: "BCA"
    },

    // ✅ Approval System
    isApproved: {
      type: Boolean,
      default: function () {
        // Student → false
        // Faculty/Admin → true
        return this.role === "student" ? false : true;
      }
    },

    // ✅ Year and Semester (students only)
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year'],
      default: null
    },
    semester: {
      type: Number,
      min: 1,
      max: 6,
      default: null
    },

    // ✅ Presence fields
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);