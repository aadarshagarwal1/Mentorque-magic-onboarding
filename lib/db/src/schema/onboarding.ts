import {
  boolean,
  json,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

function generateCuid(): string {
  const ts = Date.now().toString(36);
  const r1 = Math.random().toString(36).substring(2, 15);
  const r2 = Math.random().toString(36).substring(2, 15);
  return `c${ts}${r1}${r2}`;
}

export const resumeSettingsTable = pgTable("resume_settings", {
  id: varchar("id", { length: 50 })
    .primaryKey()
    .$defaultFn(() => generateCuid()),
  userId: varchar("user_id", { length: 50 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }),
  resumeData: json("resume_data").notNull().default({}),
  isOnboardingResume: boolean("is_onboarding_resume").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const onboardingSubmissionsTable = pgTable("onboarding_submissions", {
  id: varchar("id", { length: 50 })
    .primaryKey()
    .$defaultFn(() => generateCuid()),
  userId: varchar("user_id", { length: 50 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  basicDetails: json("basic_details").notNull().default({}),
  preferencesTaken: json("preferences_taken").notNull().default({}),
  revealResume: boolean("reveal_resume").notNull().default(false),
  resumeSettingId: varchar("resume_setting_id", { length: 50 }).references(
    () => resumeSettingsTable.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resumeReviewersTable = pgTable("resume_reviewers", {
  id: varchar("id", { length: 50 })
    .primaryKey()
    .$defaultFn(() => generateCuid()),
  onboardingId: varchar("onboarding_id", { length: 50 })
    .notNull()
    .references(() => onboardingSubmissionsTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 50 }).references(() => usersTable.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("mentor"),
  inviteToken: varchar("invite_token", { length: 100 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResumeSettingSchema = createInsertSchema(resumeSettingsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertOnboardingSubmissionSchema = createInsertSchema(
  onboardingSubmissionsTable,
).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertResumeReviewerSchema = createInsertSchema(resumeReviewersTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertResumeSetting = z.infer<typeof insertResumeSettingSchema>;
export type ResumeSetting = typeof resumeSettingsTable.$inferSelect;

export type InsertOnboardingSubmission = z.infer<
  typeof insertOnboardingSubmissionSchema
>;
export type OnboardingSubmission = typeof onboardingSubmissionsTable.$inferSelect;

export type InsertResumeReviewer = z.infer<typeof insertResumeReviewerSchema>;
export type ResumeReviewer = typeof resumeReviewersTable.$inferSelect;
