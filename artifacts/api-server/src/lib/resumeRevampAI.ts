/**
 * resumeRevampAI.ts
 * Location: artifacts/api-server/src/lib/resumeRevampAI.ts
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
  reason: string;
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

Revamp the following resume following Mentorque's strict resume guidelines, then output the full revamped resume AND a detailed list of every bullet-level change.

━━━ MENTORQUE RESUME GUIDELINES ━━━
1. Every bullet must open with a strong past-tense action verb (Developed, Led, Reduced, Built, Delivered, etc.)
2. Quantify ALL achievements — add specific numbers, percentages, scale, team size, revenue impact where inferable or stated in candidate's answers
3. Use the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]"
4. Strip filler openers: "responsible for", "helped with", "worked on", "assisted in", "participated in"
5. Show impact, not just activity — every bullet must answer "so what?"
6. Professional summary: 2-3 sentences, role-targeted, leading with top 3 value propositions, no personal pronouns
7. Skills: ATS-optimized, industry-standard terminology
8. No personal pronouns anywhere (I, my, we, our)
9. Present tense for current role, past tense for all previous
10. Each bullet 1-2 lines — trim padding, no redundancy

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
      "reason": "Added quantification and stronger action verb"
    }
  ]
}

Rules for the changes array:
- For experience bullets: section="experience", sectionIndex=index into experience[], bulletIndex=index into highlights[]
- For project bullets: section="projects", sectionIndex=index into projects[], bulletIndex=index into highlights[]
- For summary: section="summary", omit sectionIndex and bulletIndex, original=old summary, revised=new summary
- For individual skills (if changed/added): section="skills", sectionIndex=index in skills[], omit bulletIndex
- id format: "chg-{section}-{sectionIndex??0}-{bulletIndex??0}" — must be unique
- Only include entries where the text was actually changed
- reason should be 1 concise sentence explaining the improvement
- Be thorough — every suboptimal bullet should be improved`;

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

  // Guarantee every change has a stable unique id
  const changes: BulletChange[] = (result.changes || []).map((c: any, i: number) => ({
    ...c,
    id: c.id || `chg-${i}`,
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
