const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/* ===================== SIGNUP ===================== */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    // ✅ SAFE ROLE HANDLING
    const finalRole = ["student", "faculty", "admin"].includes(role)
      ? role
      : "student";

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 APPROVAL SYSTEM LOGIC
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: finalRole,
      isApproved: finalRole === "student" ? false : true   // ✅ IMPORTANT
    });

    res.status(201).json({
      success: true,
      message:
        finalRole === "student"
          ? "Signup successful. Awaiting faculty approval."
          : `${finalRole} registered successfully`
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


/* ===================== LOGIN ===================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

 
    
    if (user.role === "student" && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending faculty approval."
      });
    }
  

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});/* ===============================
   GET USER BY ID
   GET /api/auth/user/:id
================================ */
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name isOnline lastSeen').lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ===============================
   CHECK APPROVAL STATUS
   GET /api/auth/check-status/:email
================================ */
router.get("/check-status/:email", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.params.email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      approved: user.isApproved
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
