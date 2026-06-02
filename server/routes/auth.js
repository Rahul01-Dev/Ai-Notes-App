// routes/auth.js
// POST /api/auth/register
// POST /api/auth/login

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prismaClient.js";

const router = Router();

// ─── Zod Schemas ────────────────────────────────────────────────
const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .trim(),

  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be at most 72 characters"), // bcrypt limit
});

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .toLowerCase()
    .trim(),

  password: z.string({ required_error: "Password is required" }),
});

// ─── Helper: sign JWT ───────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// ─── POST /api/auth/register ────────────────────────────────────
router.post("/register", async (req, res) => {
  // 1. Validate request body
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path[0],
      message: e.message,
    }));
    return res.status(400).json({ error: "Validation failed", errors });
  }

  const { name, email, password } = result.data;

  try {
    // 2. Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email is already registered." });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, createdAt: true }, // never return password
    });

    // 5. Sign token
    const token = signToken(user);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────
router.post("/login", async (req, res) => {
  // 1. Validate request body
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path[0],
      message: e.message,
    }));
    return res.status(400).json({ error: "Validation failed", errors });
  }

  const { email, password } = result.data;

  try {
    // 2. Find user
    const user = await prisma.user.findUnique({ where: { email } });

    // 3. Use same error for wrong email OR wrong password (prevents user enumeration)
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 4. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 5. Sign token
    const token = signToken(user);

    return res.status(200).json({
      message: "Logged in successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
