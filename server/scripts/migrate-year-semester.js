/**
 * Migration script: backfill year/semester on existing documents
 * Sets year='3rd Year', semester=6 on all students without year
 * Sets targetYear='3rd Year', targetSemester=6 on all content without targetYear
 *
 * Idempotent: safe to run multiple times
 */

// 🔥 FORCE GOOGLE DNS (Fix SRV ECONNREFUSED)
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const User         = require("../models/User");
const Lecture      = require("../models/Lecture");
const Assignment   = require("../models/Assignment");
const Announcement = require("../models/Announcement");
const Attendance   = require("../models/Attendance");

async function migrate() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ No MONGO_URI found in .env");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("✅ Connected\n");

  // 1. Users (students without year)
  const userFilter = {
    role: "student",
    $or: [{ year: null }, { year: { $exists: false } }]
  };
  const userResult = await User.updateMany(userFilter, {
    $set: { year: "3rd Year", semester: 6 }
  });
  console.log(`👤 Users updated:        ${userResult.modifiedCount}`);

  // 2. Lectures
  const contentFilter = {
    $or: [{ targetYear: null }, { targetYear: { $exists: false } }]
  };
  const lectureResult = await Lecture.updateMany(contentFilter, {
    $set: { targetYear: "3rd Year", targetSemester: 6 }
  });
  console.log(`📚 Lectures updated:     ${lectureResult.modifiedCount}`);

  // 3. Assignments
  const assignResult = await Assignment.updateMany(contentFilter, {
    $set: { targetYear: "3rd Year", targetSemester: 6 }
  });
  console.log(`📝 Assignments updated:  ${assignResult.modifiedCount}`);

  // 4. Announcements
  const announceResult = await Announcement.updateMany(contentFilter, {
    $set: { targetYear: "3rd Year", targetSemester: 6 }
  });
  console.log(`📢 Announcements updated: ${announceResult.modifiedCount}`);

  // 5. Attendance
  const attendResult = await Attendance.updateMany(contentFilter, {
    $set: { targetYear: "3rd Year", targetSemester: 6 }
  });
  console.log(`✅ Attendance updated:   ${attendResult.modifiedCount}`);

  console.log("\n🎉 Migration complete!");
  await mongoose.disconnect();
  console.log("🔌 Disconnected");
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
