/**
 * resumeRevampTypes.ts
 * Location: artifacts/mentorque-onboarding/src/lib/resumeRevampTypes.ts
 *
 * Shared types for the resume revamp step.
 * Mirror of the backend types in resumeRevampAI.ts — kept in sync manually
 * (or generate via Orval once the OpenAPI spec is updated).
 */
export interface RevampQuestion {
  id: string;
  question: string;
  hint: string;
  /** Question input type — 'text' for free-form, 'mcq' for multiple choice */
  questionType: 'text' | 'mcq';
  /** Options for MCQ questions */
  options?: string[];
  section: 'experience' | 'skills' | 'summary' | 'general';
}

export type ChangeSection = 'experience' | 'projects' | 'summary' | 'skills';

/** The type of writing improvement applied to the bullet */
export type ChangeCategory =
  | 'Quantification'
  | 'Action Verb'
  | 'Impact Clarity'
  | 'XYZ Formula'
  | 'Brevity'
  | 'Tense Fix'
  | 'Pronoun Removal'
  | 'ATS Optimization';

export interface BulletChange {
  /** Stable ID for React keying and accept/reject tracking */
  id: string;
  section: ChangeSection;
  /** Index into resume.experience[] or resume.projects[] (undefined for summary/skills) */
  sectionIndex?: number;
  /** Index into the highlights[] array (undefined for summary/skills) */
  bulletIndex?: number;
  original: string;
  revised: string;

  // ─── Rich justification fields ───────────────────────────────────────────────

  /** One-sentence explanation of what was improved and why */
  reason: string;
  /** Primary category of improvement — drives the UI badge colour */
  category: ChangeCategory;
  /**
   * Which of the 10 Mentorque guidelines was the primary driver.
   * Format: "Rule N — <short rule name>"
   * e.g. "Rule 2 — Quantify ALL achievements"
   */
  guidelineRef: string;
  /**
   * If a specific metric was introduced or made more precise, quote it here.
   * Include its source in parentheses: "(from candidate answer)" or "(inferred from role)".
   * Omit the field entirely if no metric was added/changed.
   */
  metricHighlight?: string;
  /**
   * 1-2 sentences from a hiring-manager perspective explaining why this
   * category of change matters during resume screening.
   */
  coachTip: string;
}

// The three internal sub-stages of the ResumeRevampStep
export type RevampStage = 'upload' | 'questions' | 'comparison' | 'done';

export interface ParseResult {
  parsedResume: any | null;
  questions: RevampQuestion[];
  rawText: string;
}

export interface RevampResult {
  revampedResume: any;
  changes: BulletChange[];
  compiledPdfUrl: string | null;
}