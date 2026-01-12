const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// STUDENT API
router.get(
  "/student",
  authMiddleware,
  roleMiddleware(["student"]),
  (req, res) => {
    res.json({ message: "Student API success ✅" });
  }
);

// FACULTY API
router.get(
  "/faculty",
  authMiddleware,
  roleMiddleware(["faculty"]),
  (req, res) => {
    res.json({ message: "Faculty API success ✅" });
  }
);

// ADMIN API
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware(["admin"]),
  (req, res) => {
    res.json({ message: "Admin API success ✅" });
  }
);

module.exports = router;
