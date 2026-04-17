/**
 * ComparisonView.tsx
 * Location: artifacts/mentorque-onboarding/src/components/resume/ComparisonView.tsx
 *
 * Layout:
 *   LEFT  — compiled PDF preview
 *   RIGHT — bento report cards per section (navigable with ← → arrows)
 *
 * Report cards per section:
 *   1. Key Changes (before → after diffs, with flip-to-insight panel)
 *   2. Impact Analysis (what improved)
 *   3. Company Fit (hardcoded tech company logos)
 *   4. Reference Resumes (placeholder)
 *   5. Metrics (readability, keyword density, stats)
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Building2,
  FileText,
  BarChart3,
  Sparkles,
  ArrowRight,
  Info,
  Lightbulb,
  Eye,
} from "lucide-react";
import {
  SiGoogle,
  SiMeta,
  SiStripe,
  SiShopify,
  SiNetflix,
} from "react-icons/si";
import { cn } from "@/lib/utils";
import type {
  BulletChange,
  ChangeSection,
  ChangeCategory,
} from "@/lib/resumeRevampTypes";
import { PdfAnnotator } from "./PdfAnnotator";
import { SimplePdfViewer } from "./SimplePdfViewer";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ComparisonViewProps {
  originalResume: any;
  revampedResume: any;
  changes: BulletChange[];
  compiledPdfUrl: string | null;
  onFinalize?: () => void;
  apiBaseUrl?: string;
}

interface StudioCommentItem {
  highlightId: string;
  type: "ai" | "human";
  text: string;
  selectedText?: string;
  createdAt: string;
}

// Section metadata
const SECTION_META: Record<string, { label: string; icon: string }> = {
  experience: { label: "Experience", icon: "💼" },
  projects: { label: "Projects", icon: "🚀" },
  summary: { label: "Summary", icon: "✦" },
  skills: { label: "Skills", icon: "🛠" },
};

const SECTION_ORDER: ChangeSection[] = [
  "experience",
  "projects",
  "summary",
  "skills",
];

// ─── Category badge styles ───────────────────────────────────────────────────

const CATEGORY_STYLES: Record<
  ChangeCategory,
  { bg: string; border: string; text: string; dot: string }
> = {
  Quantification: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  "Action Verb": {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  "Impact Clarity": {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-400",
    dot: "bg-violet-400",
  },
  "XYZ Formula": {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  Brevity: {
    bg: "bg-slate-500/10",
    border: "border-slate-400/30",
    text: "text-slate-400",
    dot: "bg-slate-400",
  },
  "Tense Fix": {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  "Pronoun Removal": {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    dot: "bg-pink-400",
  },
  "ATS Optimization": {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
  },
};

function CategoryBadge({ category }: { category?: ChangeCategory }) {
  if (!category) return null;
  const styles = CATEGORY_STYLES[category] ?? CATEGORY_STYLES["Impact Clarity"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
        styles.bg,
        styles.border,
        styles.text,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} />
      {category}
    </span>
  );
}

// Hardcoded company data for the Company Fit card
// Inline SVG components for real brand logos
function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
    </svg>
  );
}

function AmazonLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M25.4026553,25.9595294 C24.660417,27.4418824 23.3876054,28.3962353 22.0103725,28.7181176 C21.8015298,28.7181176 21.4826213,28.8225882 21.1637129,28.8225882 C18.835399,28.8225882 17.458166,27.0211765 17.458166,24.3727059 C17.458166,20.9788235 19.4703937,19.392 22.0103725,18.6465882 C23.3876054,18.3303529 24.9793255,18.2230588 26.5682233,18.2230588 L26.5682233,19.4964706 C26.5682233,21.9331765 26.6726447,23.8390588 25.4026553,25.9595294 Z M26.5682233,13.3524706 C25.1909904,13.4569412 23.5992703,13.5614118 22.0103725,13.7703529 C19.574815,14.0922353 17.1392576,14.5157647 15.1298521,15.4701176 C11.2098182,17.0597647 8.55977364,20.4508235 8.55977364,25.4287059 C8.55977364,31.6856471 12.5842289,34.8621176 17.6726531,34.8621176 C19.3659723,34.8621176 20.7432053,34.6475294 22.0103725,34.3341176 C24.0282445,33.696 25.7187415,32.5298824 27.7309692,30.4094118 C28.8965372,31.9990588 29.2182679,32.7444706 31.2276733,34.4385882 C31.7582467,34.6475294 32.28882,34.6475294 32.7093276,34.3341176 C33.9821392,33.2724706 36.208854,31.3637647 37.3715998,30.3049412 C37.9021732,29.8814118 37.7977518,29.2432941 37.4760212,28.7181176 C36.3132753,27.2329412 35.1448851,25.9595294 35.1448851,23.0992941 L35.1448851,13.5614118 C35.1448851,9.53505882 35.4666157,5.82494118 32.5004849,3.072 C30.0649275,0.849882353 26.2493149,0 23.2831841,0 L22.0103725,0 C16.6115064,0.313411765 10.8937319,2.64564706 9.61809814,9.32329412 C9.40643324,10.1731765 10.0442501,10.4894118 10.4675799,10.5938824 L16.3998415,11.3364706 C17.0348362,11.2291765 17.3537447,10.6983529 17.458166,10.1731765 C17.9859172,7.84094118 19.8937235,6.67482353 22.0103725,6.46023529 L22.4365245,6.46023529 C23.7093361,6.46023529 25.086569,6.99105882 25.8259851,8.05270588 C26.6726447,9.32329412 26.5682233,11.0202353 26.5682233,12.5054118 L26.5682233,13.3524706 Z"
        fill="#FFFFFF"
      />
      <path
        d="M41.0489247,38.8658824 C40.8090378,38.8630588 40.5635065,38.9195294 40.3349084,39.0268235 C33.5785648,41.7882353 28.16841,43.0136471 23.1618295,43.1209412 C14.7403887,43.1322353 8.31706456,39.4785882 1.83729642,35.8785882 C1.15150215,35.6978824 0.561662624,35.808 0.344353327,36.0112941 C0.12704403,36.2174118 0,36.5138824 0,36.816 C0,37.2084706 0.208887791,37.5698824 0.505218651,37.8042353 C6.58705678,43.0870588 13.25309,48 22.2192152,48 C28.453452,47.8644706 34.902176,45.936 39.9087564,42.7905882 C40.5945507,42.3783529 41.2493008,41.9322353 41.8673623,41.4381176 C42.2511813,41.1529412 42.516468,40.7068235 42.516468,40.2437647 C42.4995348,39.4221176 41.8024517,38.8658824 41.0489247,38.8658824 Z"
        fill="#FF9A00"
      />
    </svg>
  );
}

const COMPANIES = [
  { name: "Google", icon: SiGoogle, color: "#4285F4" },
  { name: "Meta", icon: SiMeta, color: "#0668E1" },
  { name: "Stripe", icon: SiStripe, color: "#635BFF" },
  { name: "Amazon", icon: AmazonLogo, color: "#FF9900" },
  { name: "Shopify", icon: SiShopify, color: "#96BF48" },
  { name: "Netflix", icon: SiNetflix, color: "#E50914" },
  { name: "Apple", icon: AppleLogo, color: "#A2AAAD" },
];

// ─── Bento Card Base ─────────────────────────────────────────────────────────────

function BentoCard({
  title,
  icon,
  children,
  className,
  headerClassName,
  rightElement,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <motion.div
      className={cn(
        "relative rounded-[2rem] border border-blue-400/20 bg-blue-950/20 backdrop-blur-xl p-5 flex flex-col gap-4 overflow-hidden shadow-2xl transition-all duration-500 hover:bg-blue-950/30 hover:border-blue-400/30 group/card",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between shrink-0",
          headerClassName,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 text-white/70 group-hover/card:text-primary transition-colors">
            {icon}
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60 group-hover/card:text-white/90 transition-colors">
            {title}
          </h4>
        </div>
        {rightElement}
      </div>
      <div className="flex-1 relative">{children}</div>
    </motion.div>
  );
}

// ─── Card 1: Key Changes ─────────────────────────────────────────────────────────

const CARD_SLIDE_VARIANTS = {
  enter: ({
    direction,
    action,
  }: {
    direction: number;
    action: "slide" | "flip";
  }) => ({
    x: action === "slide" ? direction * 30 : 0,
    y: action === "flip" ? 8 : 0,
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: ({
    direction,
    action,
  }: {
    direction: number;
    action: "slide" | "flip";
  }) => ({
    x: action === "slide" ? direction * -30 : 0,
    y: action === "flip" ? -8 : 0,
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
  }),
};

const CONTENT_STAGGER_VARIANTS = {
  hidden: { opacity: 0, y: 12, filter: "blur(2px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 150,
      damping: 22,
      delay: i * 0.08,
    },
  }),
  exit: {
    opacity: 0,
    y: -4,
    filter: "blur(2px)",
    transition: { duration: 0.2 },
  },
};

interface KeyChangesCardProps {
  changes: BulletChange[];
  onInsightFocus: (text: string | null) => void;
}

function KeyChangesCard({ changes, onInsightFocus }: KeyChangesCardProps) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [animAction, setAnimAction] = useState<"slide" | "flip">("slide");
  const [displayIdx, setDisplayIdx] = useState(0);

  const visible = changes.length > 0 ? changes[displayIdx] : null;

  const go = (d: number) => {
    if (changes.length <= 1) return;
    const nextIdx = (idx + d + changes.length) % changes.length;
    setAnimAction("slide");
    setDir(d);
    setIdx(nextIdx);
    setDisplayIdx(nextIdx);
    // Reset to diff view when navigating, and clear focus
    if (isFlipped) {
      setIsFlipped(false);
      onInsightFocus(null);
    }
  };

  const toggleFlip = () => {
    const nextFlippedState = !isFlipped;
    setAnimAction("flip");
    setIsFlipped(nextFlippedState);
    // If opening insight, send the revised text to highlight. If closing, clear it.
    if (nextFlippedState && visible) {
      onInsightFocus(visible.revised);
    } else {
      onInsightFocus(null);
    }
  };

  return (
    <BentoCard
      title="Strategic Enhancements"
      icon={<Sparkles className="w-4 h-4" />}
      className="md:col-span-3 min-h-[260px]"
    >
      {/* Decorative background glow that shifts on flip */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="h-full flex flex-col gap-5 relative z-10">
        {/* ── Card content viewport with smooth transitions ── */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <AnimatePresence
            mode="popLayout"
            custom={{ direction: dir, action: animAction }}
            initial={false}
          >
            <motion.div
              key={`${displayIdx}-${isFlipped ? "insight" : "diff"}`}
              custom={{ direction: dir, action: animAction }}
              variants={CARD_SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 24,
                mass: 1,
              }}
              className="flex flex-col justify-center h-full w-full"
            >
              {!isFlipped ? (
                /* ── FRONT FACE: original → revised diff ── */
                <div className="flex flex-col justify-center gap-6 py-2">
                  {/* Original */}
                  <motion.div
                    custom={0}
                    variants={CONTENT_STAGGER_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative pl-6"
                  >
                    <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-gradient-to-b from-red-400/60 to-red-500/20 rounded-full" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-red-400/60 mb-1.5">
                      Original
                    </p>
                    <p className="text-sm leading-relaxed font-normal text-white/50 relative">
                      <span
                        className="relative z-10"
                        style={{
                          textDecoration: "line-through",
                          textDecorationColor: "rgba(248,113,113,0.8)",
                          textDecorationThickness: "2px",
                        }}
                      >
                        {visible?.original}
                      </span>
                    </p>
                  </motion.div>

                  {/* Revised */}
                  <motion.div
                    custom={1}
                    variants={CONTENT_STAGGER_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative pl-6"
                  >
                    <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-gradient-to-b from-emerald-400/80 to-emerald-500/30 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/80 mb-1.5">
                      Optimized
                    </p>
                    <p className="text-base text-white/90 leading-relaxed font-medium relative">
                      <span className="relative z-10">{visible?.revised}</span>
                    </p>
                  </motion.div>
                </div>
              ) : (
                /* ── BACK FACE: coaching insight panel ── */
                <div className="flex flex-col gap-4 py-2 overflow-y-auto custom-scrollbar">
                  {/* Row 1: Category badge + Guideline ref */}
                  <motion.div
                    custom={0}
                    variants={CONTENT_STAGGER_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-wrap items-center gap-2"
                  >
                    <CategoryBadge category={visible?.category} />
                    {visible?.guidelineRef && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-white/5 border-white/10 text-white/50">
                        {visible.guidelineRef}
                      </span>
                    )}
                  </motion.div>

                  {/* Row 2: Metric callout (conditional) */}
                  {visible?.metricHighlight && (
                    <motion.div
                      custom={1}
                      variants={CONTENT_STAGGER_VARIANTS}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex items-start gap-3 px-3.5 py-3 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                      <span className="text-emerald-400 text-base leading-none mt-0.5">
                        📊
                      </span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 mb-1">
                          Metric Added
                        </p>
                        <p className="text-sm text-emerald-300/90 font-medium leading-snug">
                          {visible.metricHighlight}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Row 3: Reason */}
                  {visible?.reason && (
                    <motion.div
                      custom={2}
                      variants={CONTENT_STAGGER_VARIANTS}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex flex-col gap-1"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        Why this change
                      </p>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {visible.reason}
                      </p>
                    </motion.div>
                  )}

                  {/* Row 4: Coach tip */}
                  {visible?.coachTip && (
                    <motion.div
                      custom={3}
                      variants={CONTENT_STAGGER_VARIANTS}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex items-start gap-3 px-3.5 py-3 rounded-2xl bg-white/[0.04] border border-white/10"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
                      <p className="text-xs text-white/60 leading-relaxed italic">
                        {visible.coachTip}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom bar: pagination counter + nav arrows + flip button ── */}
        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
          {/* Counter */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-white/70">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="w-8 h-px bg-white/20" />
            <span className="text-[10px] font-mono text-white/40">
              {String(changes.length).padStart(2, "0")}
            </span>
          </div>

          {/* Controls: flip + pagination */}
          <div className="flex items-center gap-2">
            {/* Flip / Insight toggle */}
            <motion.button
              onClick={toggleFlip}
              whileTap={{ scale: 0.88 }}
              title={isFlipped ? "Back to diff" : "Show insight"}
              className={cn(
                "p-2.5 rounded-xl border transition-all",
                isFlipped
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "border-white/10 bg-white/5 text-white/40 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30",
              )}
            >
              <Lightbulb className="w-4 h-4" />
            </motion.button>

            {/* Divider */}
            <div className="w-px h-5 bg-white/10" />

            {/* Prev */}
            <button
              onClick={() => go(-1)}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Next */}
            <button
              onClick={() => go(1)}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

// ─── Card 3: Company Fit ─────────────────────────────────────────────────────────
// Random success stories tied to companies
const SUCCESS_STORIES: Record<string, { message: string; role: string }> = {
  Google: {
    message:
      "One of our similar revamps got selection for SDE-2 role at Google",
    role: "→ L4 SWE, Mountain View",
  },
  Meta: {
    message: "One of our similar revamps got selection for SDE-2 role at Meta",
    role: "→ E5, Menlo Park",
  },
  Stripe: {
    message:
      "One of our similar revamps got selection for SDE-2 role at Stripe",
    role: "→ L3 Engineer, Remote",
  },
  Amazon: {
    message:
      "One of our similar revamps got selection for SDE-2 role at Amazon",
    role: "→ L6 SDE, Seattle",
  },
  Shopify: {
    message:
      "One of our similar revamps got selection for SDE-2 role at Shopify",
    role: "→ Senior Developer, Remote",
  },
  Netflix: {
    message:
      "One of our similar revamps got selection for SDE-2 role at Netflix",
    role: "→ Senior Engineer, Los Gatos",
  },
  Microsoft: {
    message:
      "One of our similar revamps got selection for SDE-2 role at Microsoft",
    role: "→ L62 SDE, Redmond",
  },
  Apple: {
    message: "One of our similar revamps got selection for SDE-2 role at Apple",
    role: "→ ICT V, Cupertino",
  },
};

function CompanyFitCard({
  compiledPdfUrl,
}: {
  compiledPdfUrl?: string | null;
}) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showResume, setShowResume] = useState(false);
  const story = selectedCompany ? SUCCESS_STORIES[selectedCompany] : null;

  return (
    <BentoCard
      title="Target Alignment"
      icon={<Building2 className="w-4 h-4" />}
      className="md:col-span-3"
    >
      <div className="relative h-full flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!selectedCompany ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                {COMPANIES.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCompany(c.name)}
                    className="group/logo relative flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-300 group-hover/logo:scale-110 group-hover/logo:border-white/20"
                      style={{
                        color: c.color,
                        backgroundColor: `${c.color}18`,
                        borderColor: `${c.color}40`,
                      }}
                    >
                      <c.icon
                        className="w-6 h-6 transition-all duration-300 group-hover/logo:drop-shadow-lg"
                        style={{ filter: `drop-shadow(0 0 6px ${c.color}66)` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-white/70 group-hover/logo:text-white transition-colors uppercase tracking-widest">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Info className="w-3.5 h-3.5" />
                <p className="text-[10px] font-medium italic">
                  Click a logo to see success story
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-4 sm:grid-cols-8 gap-4 items-center"
            >
              {/* Col 1: Logo */}
              <div className="col-span-1 flex flex-col items-center gap-2">
                {(() => {
                  const c = COMPANIES.find((co) => co.name === selectedCompany);
                  if (!c) return null;
                  return (
                    <motion.div
                      layoutId={`logo-${selectedCompany}`}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                        style={{ color: c.color }}
                      >
                        <c.icon className="w-7 h-7" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/85">
                        {selectedCompany}
                      </span>
                    </motion.div>
                  );
                })()}
              </div>

              {/* Col 2: Message */}
              <div className="col-span-2 sm:col-span-6 border-l border-white/5 pl-6">
                {story && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <p className="text-white/80 text-sm leading-relaxed font-medium">
                      {story.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-px bg-primary/40" />
                      <p className="text-primary/90 text-[10px] font-black uppercase tracking-widest">
                        {story.role}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Col 3: Unified Button */}
              <div className="col-span-1 flex items-center justify-center">
                <motion.button
                  layout
                  onClick={
                    showResume
                      ? () => {
                          setShowResume(false);
                          setSelectedCompany(null);
                        }
                      : () => setShowResume(true)
                  }
                  className={cn(
                    "group/preview flex flex-col items-center gap-2 transition-all duration-500 min-w-[110px]",
                    showResume
                      ? "text-white/40 hover:text-white"
                      : "text-white/40 hover:text-primary",
                  )}
                >
                  <motion.div
                    layout
                    className={cn(
                      "w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 relative overflow-hidden",
                      showResume
                        ? "bg-white/5 border border-white/10 group-hover/preview:bg-white/10 group-hover/preview:border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                        : "bg-primary/10 border border-primary/20 group-hover/preview:bg-primary/20 group-hover/preview:border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.05)]",
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={showResume ? "back" : "eye"}
                        initial={{
                          opacity: 0,
                          scale: 0.5,
                          rotate: showResume ? -45 : 45,
                        }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{
                          opacity: 0,
                          scale: 0.5,
                          rotate: showResume ? 45 : -45,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 28,
                        }}
                      >
                        {showResume ? (
                          <ChevronLeft className="w-5 h-5 transition-all duration-500 group-hover/preview:-translate-x-0.5" />
                        ) : (
                          <Eye className="w-5 h-5 transition-all duration-500 group-hover/preview:scale-110" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>

                  <div className="h-3 flex items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={showResume ? "back" : "eye"}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap"
                      >
                        {showResume ? "Back" : "View Sample"}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </motion.button>
              </div>

              {/* Resume Viewer Section */}
              <AnimatePresence>
                {showResume && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="mt-6 pt-6 border-t border-white/10 col-span-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        One of our similar revamps
                      </span>
                    </div>

                    {/* Clean "Paper on a desk" presentation */}
                    <div className="w-full">
                      <SimplePdfViewer
                        pdfUrl="/sample-resume.pdf"
                        className="max-h-[600px] rounded-xl border border-white/5 shadow-2xl"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BentoCard>
  );
}

// ─── Card 4: Metrics ─────────────────────────────────────────────────────────────

function MetricItem({ m }: { m: any }) {
  return (
    <div className="group/metric relative flex flex-col justify-between p-4 rounded-3xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-500 shadow-xl overflow-hidden min-h-[120px]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-right ml-auto">
          <span className="text-xs font-black tracking-tighter text-white/60">
            +
            {Math.max(
              0,
              (typeof m.value === "number" ? m.value : 100) -
                (typeof m.prev === "number" ? m.prev : 0),
            )}
            %
          </span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1 leading-none">
          {m.label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-mono font-bold text-white leading-none">
            {m.value}
          </span>
          <span className="text-sm font-mono font-bold text-white/60 leading-none">
            {m.suffix}
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricsCard({
  revampedResume,
  originalResume,
}: {
  revampedResume: any;
  originalResume?: any;
}) {
  const getStats = (res: any) => {
    const allHighlights: string[] = [];
    res?.experience?.forEach((e: any) =>
      e.highlights?.forEach((h: string) => allHighlights.push(h)),
    );
    res?.projects?.forEach((p: any) =>
      p.highlights?.forEach((h: string) => allHighlights.push(h)),
    );
    const total = allHighlights.length;
    const withNumbers = allHighlights.filter((h) => /\d/.test(h)).length;
    const actionVerbs = [
      "led",
      "engineered",
      "delivered",
      "drove",
      "spearheaded",
      "optimized",
      "architected",
      "scaled",
      "transformed",
      "accelerated",
      "generated",
      "launched",
    ];
    const withVerbs = allHighlights.filter((h) =>
      actionVerbs.some((v) => h.toLowerCase().startsWith(v)),
    ).length;
    return {
      density: total > 0 ? Math.round((withNumbers / total) * 100) : 0,
      strength: total > 0 ? Math.round((withVerbs / total) * 100) : 0,
    };
  };

  const curr = getStats(revampedResume);
  const orig = getStats(originalResume);

  const items = [
    { label: "Density", value: curr.density, prev: orig.density, suffix: "%" },
    {
      label: "Strength",
      value: curr.strength,
      prev: orig.strength,
      suffix: "%",
    },
    { label: "Match", value: 94, prev: 62, suffix: "%" },
    { label: "Reading", value: "A+", prev: "B-", suffix: "" },
  ];

  return null;
}

// ─── Report Panel (Section Specific Only) ──────────────────────────────────────────

function SectionAnalysis({
  changes,
  onInsightFocus,
}: {
  changes: BulletChange[];
  onInsightFocus: (text: string | null) => void;
}) {
  const sectionsWithChanges = useMemo(() => {
    return SECTION_ORDER.filter((s) => {
      const sectionChanges = changes.filter((c) => c.section === s);
      return sectionChanges.length > 0 || s === "experience";
    });
  }, [changes]);

  const [sectionIdx, setSectionIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (d: number) => {
    if (sectionsWithChanges.length <= 1) return;
    setDir(d);
    setSectionIdx(
      (i) => (i + d + sectionsWithChanges.length) % sectionsWithChanges.length,
    );
  };

  const currentSection = sectionsWithChanges[sectionIdx] || "experience";
  const sectionChanges = changes.filter((c) => c.section === currentSection);
  const meta = SECTION_META[currentSection] || {
    label: currentSection,
    icon: "📄",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Section Navigation */}
      <div className="flex items-center justify-between px-6 mt-4 shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-2xl shadow-2xl">
            {meta.icon}
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-lg font-bold uppercase tracking-[0.2em] text-white">
              {meta.label}
            </h3>
            <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">
              Section Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
            {sectionsWithChanges.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i === sectionIdx
                    ? "bg-primary w-6 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                    : "bg-white/10 w-1.5",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => go(-1)}
              disabled={sectionsWithChanges.length <= 1}
              className="p-3 rounded-2xl border border-white/10 text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => go(1)}
              disabled={sectionsWithChanges.length <= 1}
              className="p-3 rounded-2xl border border-white/10 text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bento Layout (Section Specific) */}
      <div className="pb-8 relative overflow-hidden">
        <AnimatePresence mode="popLayout" custom={dir}>
          <motion.div
            key={currentSection}
            custom={dir}
            variants={{
              enter: (d: number) => ({
                x: d * 40,
                opacity: 0,
              }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({
                x: d * -40,
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
          >
            <KeyChangesCard
              changes={sectionChanges}
              onInsightFocus={onInsightFocus}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────────

export function ComparisonView({
  originalResume,
  revampedResume,
  compiledPdfUrl,
  changes,
}: ComparisonViewProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "studio">("analysis");
  const [studioComments, setStudioComments] = useState<StudioCommentItem[]>([]);
  const [focusHighlightId, setFocusHighlightId] = useState<string | null>(null);
  const [focusSignal, setFocusSignal] = useState(0);
  const [insightFocusText, setInsightFocusText] = useState<string | null>(null);
  const documentId = compiledPdfUrl ?? "resume-draft";

  useEffect(() => {
    let disposed = false;

    const fetchStudioComments = async () => {
      try {
        const res = await fetch(
          `/api/highlights?documentUrl=${encodeURIComponent(documentId)}`,
        );
        const data = await res.json();
        if (!data?.success || !Array.isArray(data.highlights)) return;

        const flattened: StudioCommentItem[] = data.highlights.flatMap(
          (h: any) => {
            const selectedText = h?.content?.text;
            const comments = Array.isArray(h?.comments) ? h.comments : [];
            return comments.map((c: any) => ({
              highlightId: h.id,
              type: c?.type === "ai" ? "ai" : "human",
              text: String(c?.text ?? ""),
              selectedText:
                typeof selectedText === "string" ? selectedText : undefined,
              createdAt: String(
                c?.createdAt ?? h?.createdAt ?? new Date(0).toISOString(),
              ),
            }));
          },
        );

        flattened.sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
        );
        if (!disposed) setStudioComments(flattened);
      } catch {
        // Ignore transient fetch errors; studio tab can still render stale entries.
      }
    };

    fetchStudioComments();
    const interval = setInterval(fetchStudioComments, 5000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [documentId]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0 p-6">
        {/* LEFT — Annotatable PDF */}
        <div className="flex flex-col items-center justify-start overflow-y-auto overflow-x-auto custom-scrollbar px-1 py-2">
          <PdfAnnotator
            pdfUrl={
              compiledPdfUrl
                ? `/api/resume-revamp/proxy-pdf?url=${encodeURIComponent(compiledPdfUrl)}`
                : null
            }
            revampedResume={revampedResume}
            documentId={compiledPdfUrl ?? "resume-draft"}
            focusHighlightId={focusHighlightId}
            focusSignal={focusSignal}
            focusedInsightText={insightFocusText}
          />
        </div>

        {/* RIGHT — Analysis + Studio */}
        <div className="overflow-y-auto overflow-x-hidden flex flex-col gap-4 pr-6 custom-scrollbar h-full">
          {/* Tabs */}
          <div className="sticky top-0 z-20 pt-2 pb-3">
            <div className="w-full grid grid-cols-2 rounded-2xl border border-blue-400/20 bg-blue-950/20 backdrop-blur-xl p-1 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
              <button
                onClick={() => setActiveTab("analysis")}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === "analysis"
                    ? "bg-white/12 border border-white/20 text-white shadow-[0_0_20px_rgba(125,211,252,0.15)]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]",
                )}
              >
                Analysis
              </button>
              <button
                onClick={() => setActiveTab("studio")}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === "studio"
                    ? "bg-white/12 border border-white/20 text-white shadow-[0_0_20px_rgba(125,211,252,0.15)]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]",
                )}
              >
                Resume Studio
              </button>
            </div>
          </div>

          {activeTab === "analysis" ? (
            <>
              {/* Header */}
              <div className="flex items-end justify-between px-2 shrink-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="px-2.5 py-1.5 rounded-lg bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)] flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">
                        Revamp V1.0
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                      Resume Analysis
                    </h2>
                  </div>
                  <p className="text-white/40 text-sm font-medium">
                    Strategic enhancements and competitive benchmarking
                  </p>
                </div>

                {compiledPdfUrl && (
                  <a
                    href={compiledPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all active:scale-95 shadow-lg"
                  >
                    <FileText className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                      Export PDF
                    </span>
                  </a>
                )}
              </div>

              {/* Global Analysis Modules */}
              <div className="grid grid-cols-1 gap-6 shrink-0">
                <MetricsCard
                  revampedResume={revampedResume}
                  originalResume={originalResume}
                />
                <CompanyFitCard compiledPdfUrl={compiledPdfUrl} />
              </div>

              {/* Section-specific Analysis */}
              <div className="shrink-0">
                <SectionAnalysis
                  changes={changes}
                  onInsightFocus={setInsightFocusText}
                />
              </div>

              {/* Proceed button — bottom of scroll */}
              <button
                disabled
                className="relative w-full flex items-center justify-center mt-4 gap-8 px-8 py-5
                         rounded-2xl text-sm font-bold uppercase tracking-[0.3em]
                         bg-white/5 text-white/20 border border-white/5 cursor-not-allowed shadow-inner mb-8"
              >
                Finalize Resume
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="relative rounded-[2rem] border border-blue-400/20 bg-blue-950/20 p-6 overflow-hidden">
              {/* Rotating glow */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-gradient-to-br from-blue-400/35 via-indigo-400/20 to-cyan-300/20 blur-2xl animate-[spin_12s_linear_infinite]" />

              <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
                  Resume Studio
                </h2>
                <p className="text-white/60 text-sm mb-5">
                  All AI revamps and note comments from your PDF annotations.
                </p>

                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
                  {studioComments.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                      No comments yet. Select text in the PDF and use{" "}
                      <span className="text-white/90 font-semibold">
                        Ask AI
                      </span>{" "}
                      or{" "}
                      <span className="text-white/90 font-semibold">Note</span>.
                    </div>
                  ) : (
                    studioComments.map((item, i) => (
                      <button
                        key={`${item.highlightId}-${i}`}
                        onClick={() => {
                          setFocusHighlightId(item.highlightId);
                          setFocusSignal((n) => n + 1);
                        }}
                        className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07] hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border",
                              item.type === "ai"
                                ? "text-violet-200 border-violet-300/30 bg-violet-500/10"
                                : "text-amber-200 border-amber-300/30 bg-amber-500/10",
                            )}
                          >
                            {item.type === "ai" ? "AI Revamp" : "Note"}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {item.selectedText && (
                          <p className="text-xs text-white/50 italic border-l-2 border-white/15 pl-3 mb-2 line-clamp-2">
                            "{item.selectedText}"
                          </p>
                        )}
                        <p className="text-sm text-white/85 leading-relaxed">
                          {item.text}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
