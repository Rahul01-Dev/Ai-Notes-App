// routes/ai.js
// POST /api/notes/:id/ask
// Protected by JWT — asks Gemini a question about a specific note

import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import prisma from "../lib/prismaClient.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

// Apply JWT auth to every AI route
router.use(authMiddleware);

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

  try {
    // 2. Fetch note and verify ownership in one query
    const note = await prisma.note.findUnique({
      where: { id },
      select: { id: true, title: true, content: true, userId: true },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (note.userId !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to access this note." });
    }

    // 3. Build structured prompt — give Gemini clear context
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

    // 4. Call Gemini using the new @google/genai SDK
    const client = getClient();
    const geminiResult = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const answer = geminiResult.text;

    // 5. Return structured response
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
