const jwt = require("jsonwebtoken");

// Verifies JWT token from Authorization header
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, name, email, ... }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
