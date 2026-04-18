/**
 * ResumeRevampStep.tsx
 * Location: artifacts/mentorque-onboarding/src/steps/ResumeRevampStep.tsx
 *
 * The new onboarding step inserted between "preferences" and "experience".
 * Orchestrates resume-revamp sub-stages:
 *   1. upload       — PDF or plain-text paste
 *   2. questions    — AI-generated questions
 *   3. awaitReveal  — wait until `revealResume` is true (admin)
 *   4. comparison   — PDF preview + bento report
 *   5. done         — success, advances parent step
 *
 * Usage in your step router (e.g. App.tsx or wherever steps are defined):
 *   case 'resume-revamp':
 *     return <ResumeRevampStep onComplete={goToNextStep} />;
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Inbox,
  LayoutTemplate,
  Lightbulb,
  MessageSquare,
  Mic2,
  Radar,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { UploadPanel } from "../components/resume/UploadPanel";
import { MentorqueLoader } from "../components/resume/MentorqueLoader";
import { QuestionsForm } from "../components/resume/QuestionsForm";
import { ComparisonView } from "../components/resume/ComparisonView";
import VaporizeTextCycle, { Tag } from "../components/ui/vapour-text-effect";
import {
  type RevampStage,
  type ParseResult,
  type RevampResult,
  type RevampQuestion,
} from "../lib/resumeRevampTypes";

const STORAGE_KEY = "mentorque-revamp-data";

type RevealSlide = {
  title: string;
  items: { Icon: LucideIcon; text: string }[];
};

/** Each vapor headline + three benefits with icons (synced by index with `VaporizeTextCycle`). */
const REVEAL_SLIDES: RevealSlide[] = [
  {
    title: "2,000+ interviews landed",
    items: [
      {
        Icon: Sparkles,
        text: "Role-aligned resume and story that pass recruiter screens",
      },
      {
        Icon: Mic2,
        text: "Talking points and proof for every common interview question",
      },
      {
        Icon: RefreshCw,
        text: "A repeatable system so every application feels less random",
      },
    ],
  },
  {
    title: "Personalised outreach",
    items: [
      {
        Icon: Send,
        text: "First lines written for the role, company, and hiring manager",
      },
      {
        Icon: Inbox,
        text: "Fewer generic blasts — more replies that lead to conversations",
      },
      {
        Icon: LayoutTemplate,
        text: "Templates you can tweak in minutes, not hours",
      },
    ],
  },
  {
    title: "Job posting insights",
    items: [
      {
        Icon: Radar,
        text: "Instant read on must-have skills vs nice-to-have in each JD",
      },
      {
        Icon: Lightbulb,
        text: "Bullet ideas pulled from the posting so you sound like the hire",
      },
      {
        Icon: Target,
        text: "Faster “should I apply?” decisions with less second-guessing",
      },
    ],
  },
  {
    title: "Mentor-backed tracking",
    items: [
      {
        Icon: ClipboardList,
        text: "One place to see every application and follow-up",
      },
      {
        Icon: MessageSquare,
        text: "Feedback loops so you adjust strategy week to week",
      },
      {
        Icon: ShieldCheck,
        text: "Accountability that keeps momentum after the revamp ships",
      },
    ],
  },
];

interface ResumeRevampStepProps {
  /** Called when the user clicks "Continue" after the comparison, or skips */
  onComplete: (finalResumeData?: any) => void;
  /** Base URL of the onboarding API server. Defaults to same origin. */
  apiBaseUrl?: string;
  /** When set (e.g. from main stepper "Upload resume"), skip internal upload stage. */
  initialParseResult?: ParseResult | null;
  /** Plain resume text saved in onboarding; AI parse runs here (not on the upload step). */
  initialRawResumeText?: string | null;
  /** Onboarding row id — required to enforce `revealResume` before showing the review. */
  onboardingSubmissionId?: string | null;
  /** Firebase-backed API token for `/api/onboarding/my-submission`. */
  authToken?: string | null;
  /** Fires when URL segment is `/resume-revamp-reveal` (loading + await mentor) vs `/resume-revamp` — parent hides global stepper on reveal. */
  onRevealPathChange?: (isRevealRoute: boolean) => void;
  /** DB `input_complete` / `completed` — skip upload & questions; go straight to reveal / comparison. */
  skipEarlierRevampStages?: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResumeRevampStep({
  onComplete,
  apiBaseUrl = "",
  initialParseResult = null,
  initialRawResumeText = null,
  onboardingSubmissionId = null,
  authToken = null,
  onRevealPathChange,
  skipEarlierRevampStages = false,
}: ResumeRevampStepProps) {
  /** Direct navigation to `/resume-revamp-reveal` should show the waiting UI (same as DB-locked reveal-only). */
  const [enteredViaRevealUrl] = useState(
    () =>
      typeof window !== "undefined" &&
      window.location.pathname === "/resume-revamp-reveal",
  );
  const revealOnlyFlow = skipEarlierRevampStages || enteredViaRevealUrl;

  const revealTitles = useMemo(
    () => REVEAL_SLIDES.map((s) => s.title),
    [],
  );
  const [revealSlideIndex, setRevealSlideIndex] = useState(0);

  const fetchRevealResumeAllowed = useCallback(async (): Promise<boolean> => {
    if (!authToken?.trim()) {
      return true;
    }
    try {
      const q = onboardingSubmissionId?.trim()
        ? `?submissionId=${encodeURIComponent(onboardingSubmissionId)}`
        : "";
      const url = `${apiBaseUrl}/api/onboarding/my-submission${q}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        success?: boolean;
        submission?: { revealResume?: boolean } | null;
      };
      return Boolean(data.success && data.submission?.revealResume);
    } catch {
      return false;
    }
  }, [apiBaseUrl, onboardingSubmissionId, authToken]);
  const hasPrefilledParse = Boolean(initialParseResult?.parsedResume);
  const hasRawFromOnboarding = Boolean(initialRawResumeText?.trim());
  const [parseFromRawFailed, setParseFromRawFailed] = useState(false);
  const skipUpload =
    hasPrefilledParse || (hasRawFromOnboarding && !parseFromRawFailed);

  const [bootstrapFromRaw, setBootstrapFromRaw] = useState(
    () =>
      !revealOnlyFlow && hasRawFromOnboarding && !hasPrefilledParse,
  );

  const [stage, setStage] = useState<RevampStage>(() => {
    if (skipEarlierRevampStages) return "awaitReveal";
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/resume-revamp-reveal"
    ) {
      return "awaitReveal";
    }
    if (typeof window === "undefined") return skipUpload ? "questions" : "upload";
    const hash = window.location.hash;
    // Only restore state if there's an explicit hash (meaning user refreshed)
    if (hash) {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (hash === "#result" && data.parseResult && data.revampResult)
            return "awaitReveal";
          if (hash === "#questions" && data.parseResult) return "questions";
        }
      } catch {
        /* ignore */
      }
    }
    return skipUpload ? "questions" : "upload";
  });
  const [parseResult, setParseResult] = useState<ParseResult | null>(() => {
    if (initialParseResult?.parsedResume) return initialParseResult;
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).parseResult;
    } catch {
      /* ignore */
    }
    return null;
  });
  /** Full-screen load overlay from submit click through revamp API + reveal check. */
  const [revampFlowBusy, setRevampFlowBusy] = useState(false);

  const [revampResult, setRevampResult] = useState<RevampResult | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).revampResult;
    } catch {
      /* ignore */
    }
    return null;
  });

  // Run AI parse once when onboarding collected raw text (upload step does not parse).
  useEffect(() => {
    if (revealOnlyFlow) return;
    if (hasPrefilledParse || !hasRawFromOnboarding || parseFromRawFailed) return;

    let cancelled = false;

    const run = async () => {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved) as { parseResult?: ParseResult };
          if (data.parseResult?.parsedResume) {
            setParseResult(data.parseResult);
            setStage("questions");
            setBootstrapFromRaw(false);
            return;
          }
        }
      } catch {
        /* ignore */
      }

      const text = initialRawResumeText!.trim();
      try {
        const res = await fetch(`${apiBaseUrl}/api/resume-revamp/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = (await res.json()) as {
          parsedResume?: unknown;
          questions?: unknown[];
          rawText?: string;
          message?: string;
        };
        if (!res.ok) {
          throw new Error(data.message || "Failed to parse resume.");
        }
        if (!data.parsedResume || cancelled) return;
        const next: ParseResult = {
          parsedResume: data.parsedResume,
          questions: Array.isArray(data.questions)
            ? (data.questions as RevampQuestion[])
            : [],
          rawText: data.rawText ?? text,
        };
        setParseResult(next);
        setStage("questions");
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setParseFromRawFailed(true);
          setStage("upload");
        }
      } finally {
        if (!cancelled) setBootstrapFromRaw(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    apiBaseUrl,
    hasPrefilledParse,
    hasRawFromOnboarding,
    initialRawResumeText,
    revealOnlyFlow,
  ]);

  // Persist to sessionStorage when stage changes
  useEffect(() => {
    if (stage === "questions" && parseResult) {
      window.location.hash = "questions";
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ parseResult, revampResult: null }),
        );
      } catch {
        /* ignore */
      }
    }
    if (
      (stage === "comparison" || stage === "awaitReveal") &&
      parseResult &&
      revampResult
    ) {
      window.location.hash = "result";
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ parseResult, revampResult }),
        );
      } catch {
        /* ignore */
      }
    }
  }, [stage, parseResult, revampResult]);

  // Poll until admin sets `revealResume` on the onboarding submission
  useEffect(() => {
    if (stage !== "awaitReveal") return;
    if (!revealOnlyFlow && (!parseResult || !revampResult)) return;
    if (!authToken?.trim()) {
      if (!revealOnlyFlow) setStage("comparison");
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const ok = await fetchRevealResumeAllowed();
      if (cancelled) return;
      if (ok && revampResult) setStage("comparison");
    };
    void tick();
    const interval = window.setInterval(() => void tick(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    stage,
    parseResult,
    revampResult,
    onboardingSubmissionId,
    authToken,
    fetchRevealResumeAllowed,
    revealOnlyFlow,
  ]);

  // `/resume-revamp-reveal` while generating or waiting for mentor reveal; `/resume-revamp` otherwise.
  useEffect(() => {
    const useRevealPath = revampFlowBusy || stage === "awaitReveal";
    onRevealPathChange?.(useRevealPath);
    if (typeof window === "undefined") return;
    const next = useRevealPath ? "/resume-revamp-reveal" : "/resume-revamp";
    if (window.location.pathname !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [stage, revampFlowBusy, onRevealPathChange]);

  // Clear persisted data when going to done
  useEffect(() => {
    if (stage === "done") {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      window.location.hash = "";
    }
  }, [stage]);

  // ── Stage 1 → 2: resume parsed ──────────────────────────────────────────
  const handleParsed = (result: ParseResult) => {
    // Skip was pressed (parsedResume is null) or no questions → skip to next onboarding step
    if (!result.parsedResume || result.questions.length === 0) {
      onComplete(undefined);
      return;
    }
    setParseResult(result);
    setStage("questions");
  };

  // ── Stage 2 → awaitReveal or comparison (gated by `revealResume`) ─────────
  const handleRevamped = async (result: RevampResult) => {
    setRevampResult(result);
    const allowed = await fetchRevealResumeAllowed();
    setStage(allowed ? "comparison" : "awaitReveal");
  };

  if (
    !revealOnlyFlow &&
    bootstrapFromRaw &&
    hasRawFromOnboarding &&
    !hasPrefilledParse
  ) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 py-24">
        <MentorqueLoader size={170} />
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Preparing your profile from your resume text…
        </p>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (stage === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-6 py-20 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
            <svg viewBox="0 0 12 12" className="w-6 h-6" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-light tracking-tight text-foreground">
            Resume revamped!
          </h2>
          <p className="text-muted-foreground font-medium">
            Taking you to the next step…
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {revampFlowBusy && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-background/85 backdrop-blur-md px-6"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <MentorqueLoader size={160} />
          <div className="max-w-sm text-center space-y-2">
            <p className="text-base font-medium text-foreground">
              Building your revamped resume…
            </p>
            <p className="text-sm text-muted-foreground">
              This usually takes a few seconds. Hang tight.
            </p>
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        {!skipUpload && stage === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <UploadPanel onParsed={handleParsed} apiBaseUrl={apiBaseUrl} />
          </motion.div>
        )}

        {stage === "questions" && parseResult && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <QuestionsForm
              questions={parseResult.questions}
              parsedResume={parseResult.parsedResume}
              onRevamped={handleRevamped}
              onRevampFlowStart={() => setRevampFlowBusy(true)}
              onRevampFlowEnd={() => setRevampFlowBusy(false)}
              apiBaseUrl={apiBaseUrl}
            />
          </motion.div>
        )}

        {stage === "awaitReveal" && (
          <motion.div
            key="awaitReveal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex w-full flex-1 flex-col items-center justify-start gap-4 px-4 pt-2 pb-8 text-center"
          >
            <MentorqueLoader size={64} />
            <div className="w-full max-w-4xl min-h-[3.25rem] overflow-x-auto sm:min-h-[4.25rem]">
              <VaporizeTextCycle
                texts={revealTitles}
                onTextIndexChange={setRevealSlideIndex}
                font={{
                  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                  fontSize: "44px",
                  fontWeight: 600,
                }}
                color="rgb(255, 255, 255)"
                spread={5}
                density={5}
                animation={{
                  vaporizeDuration: 2,
                  fadeInDuration: 1,
                  waitDuration: 6,
                }}
                direction="left-to-right"
                alignment="center"
                tag={Tag.H2}
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.ul
                key={revealSlideIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="mx-auto w-full max-w-lg space-y-3 text-left md:max-w-xl"
              >
                {REVEAL_SLIDES[revealSlideIndex]?.items.map(({ Icon, text }, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3.5 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 shadow-sm backdrop-blur-md md:gap-4 md:px-5 md:py-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] md:h-11 md:w-11">
                      <Icon
                        className="h-5 w-5 text-emerald-300/95 md:h-6 md:w-6"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </span>
                    <span className="pt-0.5 text-[15px] font-medium leading-relaxed tracking-tight text-white/92 md:text-base">
                      {text}
                    </span>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
            <p className="max-w-sm text-[11px] leading-snug text-muted-foreground/90 md:text-xs">
              Your mentor unlocks your full review here when it&apos;s ready. This
              page updates automatically.
            </p>
          </motion.div>
        )}

        {stage === "comparison" && parseResult && revampResult && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="flex-1 flex flex-col min-h-0"
          >
            <ComparisonView
              originalResume={parseResult.parsedResume}
              revampedResume={revampResult.revampedResume}
              changes={revampResult.changes}
              compiledPdfUrl={revampResult.compiledPdfUrl}
              apiBaseUrl={apiBaseUrl}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}