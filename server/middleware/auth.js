// middleware/auth.js
// Protects routes — attach as middleware before any route handler

import jwt from "jsonwebtoken";

/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success  → attaches decoded payload to req.user and calls next()
 * On failure  → responds with 401
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Expect:  Authorization: Bearer <token>
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name, iat, exp }

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token." });
  }
};

export default authMiddleware;
