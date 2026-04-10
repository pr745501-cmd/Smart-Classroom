const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Role-based test endpoints to verify auth is working
router.get("/student", auth, role(["student"]), (req, res) => res.json({ message: "Student API success ✅" }));
router.get("/faculty", auth, role(["faculty"]), (req, res) => res.json({ message: "Faculty API success ✅" }));
router.get("/admin",   auth, role(["admin"]),   (req, res) => res.json({ message: "Admin API success ✅" }));

module.exports = router;
