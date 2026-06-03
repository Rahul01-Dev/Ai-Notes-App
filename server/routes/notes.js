// routes/notes.js
// All routes are protected — mount with authMiddleware in index.js
//
// GET    /api/notes        → get all notes for the logged-in user  [Redis cached 60s]
// POST   /api/notes        → create a new note                     [invalidates cache]
// PUT    /api/notes/:id    → update a note (owner only)            [invalidates cache]
// DELETE /api/notes/:id    → delete a note (owner only)            [invalidates cache]

import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prismaClient.js";
import authMiddleware from "../middleware/auth.js";
import { getRedis } from "../lib/redisClient.js";

const router = Router();

// Apply JWT auth to every note route
router.use(authMiddleware);

// ─── Cache helpers ───────────────────────────────────────────────
const NOTES_TTL = 60; // seconds

/** Cache key scoped per user */
const cacheKey = (userId) => `notes:user:${userId}`;

/** Invalidate a user's notes cache (call on write operations) */
const invalidateCache = async (userId) => {
  try {
    const redis = await getRedis();
    if (redis) await redis.del(cacheKey(userId));
  } catch {
    // Non-fatal — cache miss on next request is acceptable
  }
};

// ─── Zod Schemas ────────────────────────────────────────────────
const createNoteSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, "Title cannot be empty")
    .max(200, "Title must be at most 200 characters")
    .trim(),

  content: z
    .string({ required_error: "Content is required" })
    .min(1, "Content cannot be empty")
    .trim(),
});

const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title must be at most 200 characters")
    .trim()
    .optional(),

  content: z
    .string()
    .min(1, "Content cannot be empty")
    .trim()
    .optional(),
}).refine((data) => data.title !== undefined || data.content !== undefined, {
  message: "At least one of title or content must be provided",
});

// ─── Helper: validate & respond on failure ───────────────────────
const validate = (schema, body, res) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path[0] ?? "body",
      message: e.message,
    }));
    res.status(400).json({ error: "Validation failed", errors });
    return null;
  }
  return result.data;
};

// ─── GET /api/notes ──────────────────────────────────────────────
// Returns all notes belonging to the logged-in user, newest first.
// Results are cached in Redis for 60 seconds per user.
router.get("/", async (req, res) => {
  const userId = req.user.id;
  const key = cacheKey(userId);

  try {
    // 1. Try cache first
    const redis = await getRedis();
    if (redis) {
      const cached = await redis.get(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.status(200).json({ ...parsed, cached: true });
      }
    }

    // 2. Cache miss — query DB
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const payload = { count: notes.length, notes };

    // 3. Populate cache (fire-and-forget; non-fatal on error)
    if (redis) {
      redis.set(key, JSON.stringify(payload), { EX: NOTES_TTL }).catch(() => {});
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error("GET /notes error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── POST /api/notes ─────────────────────────────────────────────
// Creates a new note for the logged-in user. Invalidates cache.
router.post("/", async (req, res) => {
  const data = validate(createNoteSchema, req.body, res);
  if (!data) return;

  try {
    const note = await prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await invalidateCache(req.user.id);
    return res.status(201).json({ message: "Note created.", note });
  } catch (err) {
    console.error("POST /notes error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── PUT /api/notes/:id ──────────────────────────────────────────
// Updates a note — only if it belongs to the logged-in user. Invalidates cache.
router.put("/:id", async (req, res) => {
  const data = validate(updateNoteSchema, req.body, res);
  if (!data) return;

  const { id } = req.params;

  try {
    // Ownership check — single DB query
    const existing = await prisma.note.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to edit this note." });
    }

    const updated = await prisma.note.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await invalidateCache(req.user.id);
    return res.status(200).json({ message: "Note updated.", note: updated });
  } catch (err) {
    console.error("PUT /notes/:id error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── DELETE /api/notes/:id ───────────────────────────────────────
// Deletes a note — only if it belongs to the logged-in user. Invalidates cache.
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Ownership check
    const existing = await prisma.note.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to delete this note." });
    }

    await prisma.note.delete({ where: { id } });

    await invalidateCache(req.user.id);
    return res.status(200).json({ message: "Note deleted successfully." });
  } catch (err) {
    console.error("DELETE /notes/:id error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
