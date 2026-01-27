const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const User = require("../models/User");

/* =====================================
   GET ALL USERS (ADMIN)
   GET /api/admin/users
===================================== */
router.get(
  "/users",
  auth,
  role(["admin"]),
  async (req, res) => {
    try {
      const users = await User.find()
        .select("name email role")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        users
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch users"
      });
    }
  }
);

/* =====================================
   CREATE USER
   POST /api/admin/create-user
===================================== */
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

/* =====================================
   UPDATE ROLE
   PUT /api/admin/update-role/:id
===================================== */
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
// ✅ Delete User
router.delete(
  "/users/:id",
  auth,
  role(["admin"]),
  async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  }
);

module.exports = router;
