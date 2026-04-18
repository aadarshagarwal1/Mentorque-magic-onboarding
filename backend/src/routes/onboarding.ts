import { Router, Request, Response } from "express";
import {
  db,
  onboardingSubmissionsTable,
  resumeReviewersTable,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";

const router = Router();
const ADMIN_ACCESS_TOKEN =
  process.env.ADMIN_ACCESS_TOKEN ?? "tkn_8fK29xLmQ7pV3nZdR6cY1uHs";

type ReviewerRole = "user" | "admin" | "mentor";

function randomToken(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function encodeAccessToken(payload: {
  onboardingId: string;
  role: ReviewerRole;
  reviewerId?: string;
  userId?: string;
}): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

router.post("/submissions", async (req: Request, res: Response) => {
  const {
    id,
    userId,
    basicDetails = {},
    preferencesTaken = {},
    revealResume = false,
    resumeSettingId = null,
  } = req.body ?? {};

  if (!userId || typeof userId !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "userId is required." });
  }

  try {
    const [submission] = await db
      .insert(onboardingSubmissionsTable)
      .values({
        ...(id ? { id } : {}),
        userId,
        basicDetails,
        preferencesTaken,
        revealResume,
        resumeSettingId,
      })
      .returning();

    return res.json({ success: true, submission });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/submissions/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const [submission] = await db
      .select()
      .from(onboardingSubmissionsTable)
      .where(eq(onboardingSubmissionsTable.id, id));

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "Onboarding submission not found." });
    }

    return res.json({ success: true, submission });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/submissions/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { basicDetails, preferencesTaken, revealResume, resumeSettingId } =
    req.body ?? {};

  try {
    const [submission] = await db
      .update(onboardingSubmissionsTable)
      .set({
        ...(basicDetails !== undefined ? { basicDetails } : {}),
        ...(preferencesTaken !== undefined ? { preferencesTaken } : {}),
        ...(revealResume !== undefined ? { revealResume } : {}),
        ...(resumeSettingId !== undefined ? { resumeSettingId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(onboardingSubmissionsTable.id, id))
      .returning();

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "Onboarding submission not found." });
    }

    return res.json({ success: true, submission });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/reviewers", async (req: Request, res: Response) => {
  const { onboardingId, name, role, userId } = req.body ?? {};
  if (!onboardingId || typeof onboardingId !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "onboardingId is required." });
  }
  if (!name || typeof name !== "string") {
    return res.status(400).json({ success: false, message: "name is required." });
  }
  const normalizedRole: ReviewerRole =
    role === "admin" || role === "user" || role === "mentor" ? role : "mentor";

  try {
    const [reviewer] = await db
      .insert(resumeReviewersTable)
      .values({
        onboardingId,
        name,
        role: normalizedRole,
        userId: userId ?? null,
        inviteToken: normalizedRole === "mentor" ? randomToken("mtr") : null,
      })
      .returning();
    return res.json({ success: true, reviewer });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/reviewers", async (req: Request, res: Response) => {
  const onboardingId = req.query.onboardingId as string | undefined;
  if (!onboardingId) {
    return res
      .status(400)
      .json({ success: false, message: "onboardingId query param is required." });
  }

  try {
    const reviewers = await db
      .select()
      .from(resumeReviewersTable)
      .where(eq(resumeReviewersTable.onboardingId, onboardingId));
    return res.json({ success: true, reviewers });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/reviewers/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const onboardingId = req.query.onboardingId as string | undefined;
  try {
    const where = onboardingId
      ? and(
          eq(resumeReviewersTable.id, id),
          eq(resumeReviewersTable.onboardingId, onboardingId),
        )
      : eq(resumeReviewersTable.id, id);

    await db.delete(resumeReviewersTable).where(where);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/admin/:token/list", async (req: Request, res: Response) => {
  const token = req.params.token as string;
  if (token !== ADMIN_ACCESS_TOKEN) {
    return res.status(403).json({ success: false, message: "Invalid admin token." });
  }

  try {
    // Prisma "User" table uses fullName (camelCase column), not name.
    const result = await db.execute(sql<{
      onboardingId: string;
      userId: string;
      userName: string | null;
      userEmail: string | null;
      revealResume: boolean;
    }>`
      select
        os.id as "onboardingId",
        os.user_id as "userId",
        u."fullName" as "userName",
        u.email as "userEmail",
        os.reveal_resume as "revealResume"
      from onboarding_submissions os
      left join "User" u on u.id = os.user_id
    `);
    const rows = result.rows as Array<{
      onboardingId: string;
      userId: string;
      userName: string | null;
      userEmail: string | null;
      revealResume: boolean;
    }>;

    const items = rows.map((row: (typeof rows)[number]) => ({
      onboardingId: row.onboardingId,
      userId: row.userId,
      userName: row.userName ?? row.userEmail ?? "Unknown User",
      wildcardLinks: {
        resumeRevamp: `/resume-revamp?onboardingId=${encodeURIComponent(
          row.onboardingId,
        )}`,
      },
      revealResume: row.revealResume,
    }));

    return res.json({ success: true, items });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/admin/:token/mentor-links", async (req: Request, res: Response) => {
  const token = req.params.token as string;
  const { onboardingId, name, role } = req.body ?? {};
  if (token !== ADMIN_ACCESS_TOKEN) {
    return res.status(403).json({ success: false, message: "Invalid admin token." });
  }
  if (!onboardingId || typeof onboardingId !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "onboardingId is required." });
  }
  if (!name || typeof name !== "string") {
    return res.status(400).json({ success: false, message: "name is required." });
  }
  const normalizedRole: ReviewerRole =
    role === "admin" || role === "user" || role === "mentor" ? role : "mentor";

  try {
    const [reviewer] = await db
      .insert(resumeReviewersTable)
      .values({
        onboardingId,
        name,
        role: normalizedRole,
        inviteToken: randomToken("acc"),
      })
      .returning();

    return res.json({
      success: true,
      reviewer,
      wildcardLink: `/mentor/${reviewer.inviteToken}`,
      role: normalizedRole,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/mentor/claim", async (req: Request, res: Response) => {
  const { inviteToken, userId, name } = req.body ?? {};
  if (!inviteToken || typeof inviteToken !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "inviteToken is required." });
  }
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ success: false, message: "userId is required." });
  }

  try {
    const [existingByToken] = await db
      .select()
      .from(resumeReviewersTable)
      .where(eq(resumeReviewersTable.inviteToken, inviteToken));

    if (!existingByToken) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid mentor invite link." });
    }

    let reviewer = existingByToken;
    if (!existingByToken.userId) {
      const [updated] = await db
        .update(resumeReviewersTable)
        .set({
          userId,
          name: typeof name === "string" && name.trim() ? name : existingByToken.name,
          updatedAt: new Date(),
        })
        .where(eq(resumeReviewersTable.id, existingByToken.id))
        .returning();
      reviewer = updated;
    }

    // Ensure reviewer entry exists for this mentor + onboarding pair.
    const [reviewerExists] = await db
      .select({ count: sql<number>`count(*)` })
      .from(resumeReviewersTable)
      .where(
        and(
          eq(resumeReviewersTable.onboardingId, reviewer.onboardingId),
          eq(resumeReviewersTable.userId, userId),
        ),
      );

    if (Number(reviewerExists?.count ?? 0) === 0) {
      const [created] = await db
        .insert(resumeReviewersTable)
        .values({
          onboardingId: reviewer.onboardingId,
          userId,
          name: reviewer.name,
          role: "mentor",
          inviteToken,
        })
        .returning();
      reviewer = created;
    }

    const claimedRole: ReviewerRole =
      existingByToken.role === "admin" ||
      existingByToken.role === "user" ||
      existingByToken.role === "mentor"
        ? existingByToken.role
        : "mentor";

    const accessToken = encodeAccessToken({
      onboardingId: reviewer.onboardingId,
      role: claimedRole,
      reviewerId: reviewer.id,
      userId,
    });

    return res.json({
      success: true,
      reviewer,
      token: accessToken,
      payload: {
        onboardingId: reviewer.onboardingId,
        role: claimedRole,
        reviewerId: reviewer.id,
        userId,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
