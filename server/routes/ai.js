// routes/ai.js
// POST /api/notes/:id/ask
// Protected by JWT — asks Gemini a question about a specific note.
// Rate limited: 10 requests per user per day via Redis.

import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import prisma from "../lib/prismaClient.js";
import authMiddleware from "../middleware/auth.js";
import { getRedis } from "../lib/redisClient.js";

const router = Router();

// Apply JWT auth to every AI route
router.use(authMiddleware);

// ─── Rate-limit config ───────────────────────────────────────────
const DAILY_LIMIT = 10;

/** Redis key: resets every day (keyed to UTC date so it auto-expires) */
const rateLimitKey = (userId) => {
  const date = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  return `rate:ask:${userId}:${date}`;
};

// ─── Zod Schema ─────────────────────────────────────────────────
const askSchema = z.object({
  question: z
    .string({ required_error: "Question is required" })
    .min(3, "Question must be at least 3 characters")
    .max(1000, "Question must be at most 1000 characters")
    .trim(),
});

// ─── Gemini client (lazy init — created once per process) ────────
let genAI = null;
const getClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      throw new Error("GEMINI_API_KEY is not configured in .env");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

// ─── POST /api/notes/:id/ask ─────────────────────────────────────
router.post("/:id/ask", async (req, res) => {
  // 1. Validate request body
  const result = askSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path[0] ?? "body",
      message: e.message,
    }));
    return res.status(400).json({ error: "Validation failed", errors });
  }

  const { question } = result.data;
  const { id } = req.params;
  const userId = req.user.id;

  // 2. ── Redis rate limiting ────────────────────────────────────
  try {
    const redis = await getRedis();
    if (redis) {
      const key = rateLimitKey(userId);

      // Atomic increment
      const count = await redis.incr(key);

      // Set TTL on first request of the day (expires at midnight UTC + buffer)
      if (count === 1) {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setUTCHours(24, 0, 0, 0);
        const secondsUntilMidnight = Math.ceil((midnight - now) / 1000);
        await redis.expire(key, secondsUntilMidnight);
      }

      if (count > DAILY_LIMIT) {
        const key2 = rateLimitKey(userId);
        const ttl = await redis.ttl(key2);
        const hoursLeft = Math.ceil(ttl / 3600);
        return res.status(429).json({
          error: "Daily limit reached",
          message: `You have used all ${DAILY_LIMIT} AI requests for today. Resets in ~${hoursLeft} hour(s).`,
          limit: DAILY_LIMIT,
          used: count - 1,
          resetsIn: ttl,
        });
      }

      // Set rate-limit headers for transparency
      res.setHeader("X-RateLimit-Limit", DAILY_LIMIT);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, DAILY_LIMIT - count));
    }
  } catch (rlErr) {
    // Non-fatal — if Redis is down, allow the request through
    console.warn("Rate-limit check failed (Redis unavailable):", rlErr.message);
  }

  try {
    // 3. Fetch note and verify ownership in one query
    const note = await prisma.note.findUnique({
      where: { id },
      select: { id: true, title: true, content: true, userId: true },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (note.userId !== userId) {
      return res.status(403).json({ error: "You do not have permission to access this note." });
    }

    // 4. Build structured prompt — give Gemini clear context
    const prompt = `You are a helpful AI assistant for a notes app.
The user has a note with the following details:

Title: ${note.title}

Content:
${note.content}

---
The user is asking the following question about this note:
"${question}"

Please answer the question clearly and concisely based on the note content above.
If the answer cannot be found in the note, say so honestly and offer general help.`;

    // 5. Call Gemini using the new @google/genai SDK
    const client = getClient();
    const geminiResult = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const answer = geminiResult.text;

    // 6. Return structured response
    return res.status(200).json({
      noteId: note.id,
      noteTitle: note.title,
      question,
      answer,
    });
  } catch (err) {
    // Surface mis-configuration clearly
    if (err.message?.includes("GEMINI_API_KEY")) {
      return res.status(503).json({ error: err.message });
    }

    // Gemini API errors (quota, invalid key, model not found, overload, etc.)
    const statusCode = err.status ?? err.statusCode;
    if ([400, 401, 403, 404, 429, 503].includes(statusCode)) {
      console.error("Gemini API error:", err.message);
      const msg =
        statusCode === 503
          ? "AI service is temporarily overloaded. Please try again in a few seconds."
          : "AI service error: " + err.message;
      return res.status(502).json({ error: msg });
    }

    console.error("POST /notes/:id/ask error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
