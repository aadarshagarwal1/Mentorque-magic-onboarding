/**
 * resumeRevampAI.ts
 * Location: backend/src/lib/resumeRevampAI.ts
 *
 * Two AI operations for the resume revamp step:
 *   1. generateQuestionsFromResume  — produces 5-7 targeted profile questions
 *   2. revampResume                 — rewrites the resume per Mentorque guidelines
 *                                     and returns a structured per-bullet diff
 */

import OpenAI from 'openai';

const MODEL = 'gpt-4.1';

function getClient(): OpenAI {
  const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured.');
  return new OpenAI({ apiKey });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RevampQuestion {
  id: string;
  question: string;
  hint: string;
  /** Question input type — 'text' for free-form, 'mcq' for multiple choice */
  questionType: 'text' | 'mcq';
  /** Options for MCQ questions */
  options?: string[];
  /** Which section of the resume this question targets (informational) */
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

export interface RevampResult {
  revampedResume: any;
  changes: BulletChange[];
}

// ─── 1. Question generation ───────────────────────────────────────────────────

export async function generateQuestionsFromResume(
  parsedResume: any,
): Promise<RevampQuestion[]> {
  const client = getClient();

  // Build a compact summary so we don't blow the token budget
  const summary = {
    name: `${parsedResume.personalInfo?.firstName || ''} ${parsedResume.personalInfo?.lastName || ''}`.trim(),
    summary: parsedResume.professionalSummary?.slice(0, 200),
    experienceRoles: (parsedResume.experience || []).map((e: any) => `${e.position} @ ${e.company}`),
    skills: (parsedResume.skills || []).slice(0, 15),
    projects: (parsedResume.projects || []).map((p: any) => p.name),
  };

  const prompt = `You are a professional career coach for Mentorque, a mentorship platform.

Analyze this candidate's professional profile holistically and generate exactly 5 insightful questions to understand their crux before revamping their resume.

MIX question types strategically:
- Use "mcq" for questions where you can anticipate reasonable options (target role, industry focus, career stage, work preference)
- Use "text" for open-ended questions requiring personal context (biggest achievement, unique contribution, career goals)

Goals:
- Understand what role/level they're targeting next
- Uncover their most impactful achievement across all experiences
- Identify their domain expertise and industry focus
- Surface what makes them unique vs peers
- Clarify metrics they can quantify but didn't list

Candidate summary:
${JSON.stringify(summary, null, 2)}

Return ONLY a JSON object with a "questions" array. No markdown, no preamble.

Schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "Specific question text — reference their actual companies/roles where relevant",
      "hint": "Short example answer or guidance (1 sentence)",
      "questionType": "text" | "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "section": "experience" | "skills" | "summary" | "general"
    }
  ]
}

Rules:
- Generate EXACTLY 5 questions
- At least 2 MCQ and at least 2 text questions
- MCQ options must be relevant to this specific candidate's profile
- Reference their actual companies, roles, and projects in questions`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are a career coach. Return only valid JSON with questionType field.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.45,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{"questions":[]}';
  const parsed = JSON.parse(content);
  const questions: RevampQuestion[] = parsed.questions || [];

  // Ensure IDs and questionType are stable
  return questions.map((q, i) => ({
    ...q,
    id: q.id || `q${i + 1}`,
    questionType: q.questionType || 'text',
  }));
}

// ─── 2. Resume revamp + diff ──────────────────────────────────────────────────

export async function revampResume(
  parsedResume: any,
  answers: Record<string, string>,
): Promise<RevampResult> {
  const client = getClient();

  const answersText = Object.keys(answers).length
    ? Object.entries(answers).map(([id, ans]) => `${id}: ${ans}`).join('\n')
    : 'No additional context provided.';

  const prompt = `You are an expert resume writer for Mentorque, a professional mentorship platform.

Revamp the following resume following Mentorque's strict resume guidelines, then output the full revamped resume AND a detailed list of every bullet-level change with rich justification metadata.

━━━ MENTORQUE RESUME GUIDELINES ━━━
Rule 1:  Every bullet must open with a strong past-tense action verb (Developed, Led, Reduced, Built, Delivered, etc.)
Rule 2:  Quantify ALL achievements — add specific numbers, percentages, scale, team size, revenue impact where inferable or stated in candidate's answers
Rule 3:  Use the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]"
Rule 4:  Strip filler openers: "responsible for", "helped with", "worked on", "assisted in", "participated in"
Rule 5:  Show impact, not just activity — every bullet must answer "so what?"
Rule 6:  Professional summary: 2-3 sentences, role-targeted, leading with top 3 value propositions, no personal pronouns
Rule 7:  Skills: ATS-optimized, industry-standard terminology
Rule 8:  No personal pronouns anywhere (I, my, we, our)
Rule 9:  Present tense for current role, past tense for all previous
Rule 10: Each bullet 1-2 lines — trim padding, no redundancy

━━━ CHANGE CATEGORY TAXONOMY ━━━
Every change must be classified as exactly one of these categories:
- "Quantification"   → a metric, number, %, $, scale, or team size was added or made more precise
- "Action Verb"      → the opening verb was replaced with a stronger, more specific one
- "Impact Clarity"   → the "so what?" was added — outcome or business impact made explicit
- "XYZ Formula"      → restructured to accomplished [X] measured by [Y] by doing [Z]
- "Brevity"          → filler phrases removed, bullet made tighter without losing meaning
- "Tense Fix"        → verb tense corrected (past for old roles, present for current)
- "Pronoun Removal"  → personal pronouns (I, my, we, our) removed
- "ATS Optimization" → skill or keyword rewritten to industry-standard ATS terminology

━━━ ADDITIONAL CONTEXT FROM CANDIDATE ━━━
${answersText}

━━━ ORIGINAL RESUME ━━━
${JSON.stringify(parsedResume, null, 2)}

━━━ OUTPUT REQUIREMENTS ━━━
Return a single JSON object with exactly this structure (no markdown):

{
  "revampedResume": { /* full resume data in the EXACT same schema as the input — all fields preserved */ },
  "changes": [
    {
      "id": "chg-exp-0-0",
      "section": "experience",
      "sectionIndex": 0,
      "bulletIndex": 0,
      "original": "Original bullet text",
      "revised": "Revamped bullet text",
      "reason": "One clear sentence: what specifically was changed and what problem it fixes",
      "category": "Quantification",
      "guidelineRef": "Rule 2 — Quantify ALL achievements",
      "metricHighlight": "Added: 40% reduction in load time (from candidate answer about performance work)",
      "coachTip": "Hiring managers at top tech companies spend 6 seconds on a resume — numbers are the fastest signal of real impact."
    }
  ]
}

━━━ RULES FOR THE CHANGES ARRAY ━━━
Structural rules:
- For experience bullets: section="experience", sectionIndex=index into experience[], bulletIndex=index into highlights[]
- For project bullets: section="projects", sectionIndex=index into projects[], bulletIndex=index into highlights[]
- For summary: section="summary", omit sectionIndex and bulletIndex, original=old summary, revised=new summary
- For individual skills (if changed/added): section="skills", sectionIndex=index in skills[], omit bulletIndex
- id format: "chg-{section}-{sectionIndex??0}-{bulletIndex??0}" — must be unique
- Only include entries where the text was actually changed

Justification rules (CRITICAL — these power the coaching UI):
- reason: 1 sentence, be specific about WHAT was changed ("'responsible for' replaced with 'Engineered'") and WHY ("eliminates passive voice flagged by ATS parsers")
- category: must be exactly one value from the taxonomy above — pick the PRIMARY improvement if multiple apply
- guidelineRef: must be in format "Rule N — <exact rule name from the guidelines above>"
- metricHighlight: ONLY include if a concrete number/% was introduced or made more precise. Quote the exact metric and note its source: "(from candidate answer)", "(inferred from role level)", or "(industry benchmark)". OMIT the field entirely if no metric change occurred.
- coachTip: 1-2 sentences written as if a senior recruiter/hiring manager is speaking. Should explain WHY this category of change improves screening outcomes — not just restate what was done. Make it feel like insider knowledge.

Be thorough — every suboptimal bullet should be improved. Quality over speed on the justifications.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are an expert resume writer. Return only valid JSON, no markdown.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
    max_tokens: 8000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from OpenAI during revamp');

  const result = JSON.parse(content);

  // Guarantee every change has a stable unique id and required fields
  const changes: BulletChange[] = (result.changes || []).map((c: any, i: number) => ({
    ...c,
    id: c.id || `chg-${i}`,
    category: c.category || 'Impact Clarity',
    guidelineRef: c.guidelineRef || 'Rule 5 — Show impact, not just activity',
    coachTip: c.coachTip || 'Strong bullets combine a clear action, a measurable result, and context that shows scope.',
  }));

  return {
    revampedResume: result.revampedResume || parsedResume,
    changes,
  };
}

// ─── 3. Apply accepted changes back onto a base resume ───────────────────────

/**
 * Given the original parsedResume and the user's accept/reject decisions,
 * build the final merged resume ready for compilation.
 */
export function applyAcceptedChanges(
  originalResume: any,
  revampedResume: any,
  changes: BulletChange[],
  acceptedIds: Set<string>,
): any {
  // Start from a deep clone of the original
  const final = JSON.parse(JSON.stringify(originalResume));

  for (const change of changes) {
    if (!acceptedIds.has(change.id)) continue; // user rejected

    if (change.section === 'summary') {
      final.professionalSummary = change.revised;

    } else if (change.section === 'experience' && change.sectionIndex !== undefined && change.bulletIndex !== undefined) {
      if (final.experience?.[change.sectionIndex]?.highlights) {
        final.experience[change.sectionIndex].highlights[change.bulletIndex] = change.revised;
      }

    } else if (change.section === 'projects' && change.sectionIndex !== undefined && change.bulletIndex !== undefined) {
      if (final.projects?.[change.sectionIndex]?.highlights) {
        final.projects[change.sectionIndex].highlights[change.bulletIndex] = change.revised;
      }

    } else if (change.section === 'skills' && change.sectionIndex !== undefined) {
      if (Array.isArray(final.skills)) {
        final.skills[change.sectionIndex] = change.revised;
      }
    }
  }

  return final;
}