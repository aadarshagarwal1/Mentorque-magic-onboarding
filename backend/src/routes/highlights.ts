/**
 * highlights.ts  (Express router)
 * Location: backend/src/routes/highlights.ts
 *
 * Endpoints:
 *   GET    /api/highlights?documentUrl=...  — fetch all review comments for a PDF
 *   POST   /api/highlights                  — save a new review comment
 *   DELETE /api/highlights/:id              — delete a highlight
 *   PATCH  /api/highlights/:id/resolve      — resolve/unresolve thread
 *   POST   /api/highlights/ai-review        — AI review of selected text
 */

import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { highlightsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured.");
  return new OpenAI({ apiKey });
}

// ─── GET /api/highlights ──────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  const { documentUrl, onboardingId, reviewerId, inReplyToId, includeResolved } =
    req.query;

  try {
    const filters = [];
    if (typeof documentUrl === "string" && documentUrl.trim()) {
      filters.push(eq(highlightsTable.documentUrl, documentUrl));
    }
    if (typeof onboardingId === "string" && onboardingId.trim()) {
      filters.push(eq(highlightsTable.onboardingId, onboardingId));
    }
    if (typeof reviewerId === "string" && reviewerId.trim()) {
      filters.push(eq(highlightsTable.reviewerId, reviewerId));
    }
    if (typeof inReplyToId === "string" && inReplyToId.trim()) {
      filters.push(eq(highlightsTable.inReplyToId, inReplyToId));
    }
    if (includeResolved !== "true") {
      filters.push(eq(highlightsTable.isResolved, false));
    }

    const whereExpr =
      filters.length === 0
        ? undefined
        : filters.length === 1
          ? filters[0]
          : and(...filters);

    const highlights = whereExpr
      ? await db.select().from(highlightsTable).where(whereExpr)
      : await db.select().from(highlightsTable);
    return res.json({ success: true, highlights });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/highlights ─────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  const {
    documentUrl,
    position,
    content,
    comments,
    userId,
    onboardingId,
    reviewerId,
    inReplyToId,
    isResolved,
  } = req.body;

  if (!documentUrl || !position || !content) {
    return res.status(400).json({
      success: false,
      message: "documentUrl, position, and content are required.",
    });
  }

  try {
    const [highlight] = await db
      .insert(highlightsTable)
      .values({
        userId: userId ?? null,
        onboardingId: onboardingId ?? null,
        reviewerId: reviewerId ?? null,
        inReplyToId: inReplyToId ?? null,
        isResolved: Boolean(isResolved),
        documentUrl,
        pageNumber: position.pageNumber ?? 1,
        position,
        content,
        comments: comments ?? [],
      })
      .returning();
    return res.json({ success: true, highlight });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/highlights/ai-review ──────────────────────────────────────────
// Must be defined BEFORE /:id to avoid route conflict
router.post("/ai-review", async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ success: false, message: "text is required." });
  }

  try {
    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are a professional resume reviewer and career coach. 
You review selected resume text and give concise, actionable suggestions to improve impact, clarity, and ATS alignment.
Keep feedback under 3 sentences. Be specific — reference the exact wording and suggest a concrete improvement.`,
        },
        {
          role: "user",
          content: `Review this resume text and suggest an improvement:\n\n"${text.trim()}"`,
        },
      ],
      temperature: 0.4,
      max_tokens: 200,
    });

    const suggestion = completion.choices[0]?.message?.content?.trim() ?? "No suggestion available.";
    return res.json({ success: true, suggestion });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/highlights/:id ───────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.delete(highlightsTable).where(eq(highlightsTable.id, id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/highlights/:id/resolve ─────────────────────────────────────────
router.patch("/:id/resolve", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isResolved } = req.body ?? {};
  if (typeof isResolved !== "boolean") {
    return res
      .status(400)
      .json({ success: false, message: "isResolved boolean is required." });
  }

  try {
    const [highlight] = await db
      .update(highlightsTable)
      .set({
        isResolved,
        updatedAt: new Date(),
      })
      .where(eq(highlightsTable.id, id))
      .returning();
    return res.json({ success: true, highlight });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
