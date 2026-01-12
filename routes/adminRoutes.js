const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const User = require("../models/User");

// ✅ Create User
router.post(
  "/create-user",
  auth,
  role(["admin"]),
  async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.json({ message: "User created successfully" });
  }
);

// ✅ Update Role
router.put(
  "/update-role/:id",
  auth,
  role(["admin"]),
  async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, {
      role: req.body.role
    });
    res.json({ message: "Role updated" });
  }
);

module.exports = router;
