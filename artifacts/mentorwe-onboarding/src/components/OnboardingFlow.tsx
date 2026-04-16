import { cn } from "@/lib/utils";
import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
  createContext,
  Children,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  Loader,
  Briefcase,
  MapPin,
  User,
  Users,
  TrendingUp,
  Target,
  Globe,
  Building2,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  type Variants,
  type Transition,
} from "framer-motion";
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from "canvas-confetti";
import confetti from "canvas-confetti";
import { ResumeRevampStep } from "../steps/ResumeRevampStep";
import { BlurFade, GlassButton, TextLoop } from "./ui/OnboardingUI";
// Add these to your existing imports
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";

type Api = { fire: (options?: ConfettiOptions) => void };
export type ConfettiRef = Api | null;
const ConfettiContext = createContext<Api>({} as Api);

const Confetti = forwardRef<
  ConfettiRef,
  React.ComponentPropsWithRef<"canvas"> & {
    options?: ConfettiOptions;
    globalOptions?: ConfettiGlobalOptions;
    manualstart?: boolean;
  }
>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = false,
    ...rest
  } = props;
  const instanceRef = useRef<ConfettiInstance | null>(null);
  const canvasRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node !== null) {
        if (instanceRef.current) return;
        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        });
      } else {
        if (instanceRef.current) {
          instanceRef.current.reset();
          instanceRef.current = null;
        }
      }
    },
    [globalOptions],
  );
  const fire = useCallback(
    (opts = {}) => instanceRef.current?.({ ...options, ...opts }),
    [options],
  );
  const api = useMemo(() => ({ fire }), [fire]);
  useImperativeHandle(ref, () => api, [api]);
  useEffect(() => {
    if (!manualstart) fire();
  }, [manualstart, fire]);
  return <canvas ref={canvasRef} {...rest} />;
});
Confetti.displayName = "Confetti";

const GradientBackground = () => (
  <>
    <style>
      {`@keyframes float1 { 0% { transform: translate(0, 0); } 50% { transform: translate(-10px, 10px); } 100% { transform: translate(0, 0); } } @keyframes float2 { 0% { transform: translate(0, 0); } 50% { transform: translate(10px, -10px); } 100% { transform: translate(0, 0); } }`}
    </style>
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className="absolute top-0 left-0 w-full h-full"
    >
      <defs>
        {/* Ambient bubbles: black + blue only (fixed HSL blues ~218–232°) */}
        <linearGradient id="rev_grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{
              stopColor: "hsl(225 88% 52%)",
              stopOpacity: 0.45,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: "#000000",
              stopOpacity: 0.78,
            }}
          />
        </linearGradient>
        <linearGradient id="rev_grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{
              stopColor: "#000000",
              stopOpacity: 0.72,
            }}
          />
          <stop
            offset="50%"
            style={{
              stopColor: "hsl(220 75% 42%)",
              stopOpacity: 0.55,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: "hsl(230 90% 48%)",
              stopOpacity: 0.4,
            }}
          />
        </linearGradient>
        <radialGradient id="rev_grad3" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            style={{
              stopColor: "hsl(218 85% 46%)",
              stopOpacity: 0.55,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: "#000000",
              stopOpacity: 0.65,
            }}
          />
        </radialGradient>
        <filter id="rev_blur1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="35" />
        </filter>
        <filter id="rev_blur2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="25" />
        </filter>
        <filter id="rev_blur3" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="45" />
        </filter>
      </defs>
      <g style={{ animation: "float1 20s ease-in-out infinite" }}>
        <ellipse
          cx="200"
          cy="500"
          rx="250"
          ry="180"
          fill="url(#rev_grad1)"
          filter="url(#rev_blur1)"
          transform="rotate(-30 200 500)"
        />
        <rect
          x="500"
          y="100"
          width="300"
          height="250"
          rx="80"
          fill="url(#rev_grad2)"
          filter="url(#rev_blur2)"
          transform="rotate(15 650 225)"
        />
      </g>
      <g style={{ animation: "float2 25s ease-in-out infinite" }}>
        <circle
          cx="650"
          cy="450"
          r="150"
          fill="url(#rev_grad3)"
          filter="url(#rev_blur3)"
          opacity="0.7"
        />
        <ellipse
          cx="50"
          cy="150"
          rx="180"
          ry="120"
          fill="hsl(222 80% 38%)"
          filter="url(#rev_blur2)"
          opacity="0.65"
        />
      </g>
    </svg>
  </>
);

const GLASS_STYLES = `
  input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; }
  input[type="password"]::-webkit-credentials-auto-fill-button, input[type="password"]::-webkit-strong-password-auto-fill-button { display: none !important; }
  /* --foreground is HSL components only; must use hsl() for valid color (avoids black typed text). */
  input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px transparent inset !important; -webkit-text-fill-color: hsl(var(--foreground)) !important; background-color: transparent !important; background-clip: content-box !important; transition: background-color 5000s ease-in-out 0s !important; color: hsl(var(--foreground)) !important; caret-color: hsl(var(--foreground)) !important; }
  input:autofill { background-color: transparent !important; background-clip: content-box !important; -webkit-text-fill-color: hsl(var(--foreground)) !important; color: hsl(var(--foreground)) !important; }
  input:-internal-autofill-selected { background-color: transparent !important; background-image: none !important; color: hsl(var(--foreground)) !important; -webkit-text-fill-color: hsl(var(--foreground)) !important; }
  input:-webkit-autofill::first-line { color: hsl(var(--foreground)) !important; -webkit-text-fill-color: hsl(var(--foreground)) !important; }
  @property --angle-1 { syntax: "<angle>"; inherits: false; initial-value: -75deg; }
  @property --angle-2 { syntax: "<angle>"; inherits: false; initial-value: -45deg; }
  .glass-button-wrap { --anim-time: 400ms; --anim-ease: cubic-bezier(0.25, 1, 0.5, 1); --border-width: clamp(1px, 0.0625em, 4px); position: relative; z-index: 2; transform-style: preserve-3d; transition: transform var(--anim-time) var(--anim-ease); }
  .glass-button-wrap:has(.glass-button:active) { transform: rotateX(25deg); }
  .glass-button-shadow { --shadow-cutoff-fix: 2em; position: absolute; width: calc(100% + var(--shadow-cutoff-fix)); height: calc(100% + var(--shadow-cutoff-fix)); top: calc(0% - var(--shadow-cutoff-fix) / 2); left: calc(0% - var(--shadow-cutoff-fix) / 2); filter: blur(clamp(2px, 0.125em, 12px)); transition: filter var(--anim-time) var(--anim-ease); pointer-events: none; z-index: 0; }
  .glass-button-shadow::after { content: ""; position: absolute; inset: 0; border-radius: 9999px; background: linear-gradient(180deg, oklch(from var(--foreground) l c h / 20%), oklch(from var(--foreground) l c h / 10%)); width: calc(100% - var(--shadow-cutoff-fix) - 0.25em); height: calc(100% - var(--shadow-cutoff-fix) - 0.25em); top: calc(var(--shadow-cutoff-fix) - 0.5em); left: calc(var(--shadow-cutoff-fix) - 0.875em); padding: 0.125em; box-sizing: border-box; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all var(--anim-time) var(--anim-ease); opacity: 1; }
  .glass-button { -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all var(--anim-time) var(--anim-ease); background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 5%)); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.25em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%), 0 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%), 0 0 0 0 oklch(from var(--background) l c h); }
  .glass-button:hover { transform: scale(0.975); backdrop-filter: blur(0.01em); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.15em 0.05em -0.1em oklch(from var(--foreground) l c h / 25%), 0 0 0.05em 0.1em inset oklch(from var(--background) l c h / 50%), 0 0 0 0 oklch(from var(--background) l c h); }
  .glass-button-text { color: oklch(from var(--foreground) l c h / 90%); text-shadow: 0em 0.25em 0.05em oklch(from var(--foreground) l c h / 10%); transition: all var(--anim-time) var(--anim-ease); }
  .glass-button:hover .glass-button-text { text-shadow: 0.025em 0.025em 0.025em oklch(from var(--foreground) l c h / 12%); }
  .glass-button-text::after { content: ""; display: block; position: absolute; width: calc(100% - var(--border-width)); height: calc(100% - var(--border-width)); top: calc(0% + var(--border-width) / 2); left: calc(0% + var(--border-width) / 2); box-sizing: border-box; border-radius: 9999px; overflow: clip; background: linear-gradient(var(--angle-2), transparent 0%, oklch(from var(--background) l c h / 50%) 40% 50%, transparent 55%); z-index: 3; mix-blend-mode: screen; pointer-events: none; background-size: 200% 200%; background-position: 0% 50%; transition: background-position calc(var(--anim-time) * 1.25) var(--anim-ease); }
  .glass-button:hover .glass-button-text::after { background-position: 100% 50%; }
  .glass-button-text::before { content: ""; position: absolute; inset: 0; border-radius: 9999px; padding: var(--border-width); background: conic-gradient(from var(--angle-1) at 50% 50%, oklch(from var(--foreground) l c h / 50%) 0%, transparent 5% 40%, oklch(from var(--foreground) l c h / 50%) 50%, transparent 60% 95%, oklch(from var(--foreground) l c h / 50%) 100%), linear-gradient(180deg, oklch(from var(--background) l c h / 50%), oklch(from var(--background) l c h / 50%)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; z-index: 1; pointer-events: none; box-sizing: border-box; width: calc(100% + var(--border-width)); height: calc(100% + var(--border-width)); top: calc(0% - var(--border-width) / 2); left: calc(0% - var(--border-width) / 2); }
  .glass-input-wrap { position: relative; z-index: 2; transform-style: preserve-3d; border-radius: 9999px; }
  .glass-input { display: flex; position: relative; width: 100%; align-items: center; gap: 0.5rem; border-radius: 9999px; padding: 0.25rem; -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1); background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 5%)); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.25em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%), 0 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%), 0 0 0 0 oklch(from var(--background) l c h); }
  .glass-input-wrap:focus-within .glass-input { backdrop-filter: blur(0.01em); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.15em 0.05em -0.1em oklch(from var(--foreground) l c h / 25%), 0 0 0.05em 0.1em inset oklch(from var(--background) l c h / 50%), 0 0 0 0 oklch(from var(--background) l c h); }
  .glass-input::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 9999px; width: calc(100% + clamp(1px, 0.0625em, 4px)); height: calc(100% + clamp(1px, 0.0625em, 4px)); top: calc(0% - clamp(1px, 0.0625em, 4px) / 2); left: calc(0% - clamp(1px, 0.0625em, 4px) / 2); padding: clamp(1px, 0.0625em, 4px); box-sizing: border-box; background: conic-gradient(from var(--angle-1) at 50% 50%, oklch(from var(--foreground) l c h / 50%) 0%, transparent 5% 40%, oklch(from var(--foreground) l c h / 50%) 50%, transparent 60% 95%, oklch(from var(--foreground) l c h / 50%) 100%), linear-gradient(180deg, oklch(from var(--background) l c h / 50%), oklch(from var(--background) l c h / 50%)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; pointer-events: none; }
  .glass-input input, .glass-textarea textarea, .glass-select { color: hsl(var(--foreground)) !important; caret-color: hsl(var(--foreground)); -webkit-text-fill-color: hsl(var(--foreground)); }
  .glass-input input::placeholder, .glass-textarea textarea::placeholder { color: hsl(var(--foreground) / 0.55); -webkit-text-fill-color: hsl(var(--foreground) / 0.55); opacity: 1; }
  .glass-input input { padding: 0.75rem 0.25rem; }
  .glass-textarea-wrap { position: relative; z-index: 2; transform-style: preserve-3d; border-radius: 1rem; }
  .glass-textarea { display: flex; position: relative; width: 100%; align-items: flex-start; gap: 0.5rem; border-radius: 1rem; padding: 0.25rem; -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1); background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 5%)); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.25em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%), 0 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%); }
  .glass-textarea-wrap:focus-within .glass-textarea { box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.15em 0.05em -0.1em oklch(from var(--foreground) l c h / 25%), 0 0 0.05em 0.1em inset oklch(from var(--background) l c h / 50%); }
  .glass-textarea::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 1rem; width: calc(100% + clamp(1px, 0.0625em, 4px)); height: calc(100% + clamp(1px, 0.0625em, 4px)); top: calc(0% - clamp(1px, 0.0625em, 4px) / 2); left: calc(0% - clamp(1px, 0.0625em, 4px) / 2); padding: clamp(1px, 0.0625em, 4px); box-sizing: border-box; background: conic-gradient(from var(--angle-1) at 50% 50%, oklch(from var(--foreground) l c h / 50%) 0%, transparent 5% 40%, oklch(from var(--foreground) l c h / 50%) 50%, transparent 60% 95%, oklch(from var(--foreground) l c h / 50%) 100%), linear-gradient(180deg, oklch(from var(--background) l c h / 50%), oklch(from var(--background) l c h / 50%)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; pointer-events: none; }
  .glass-select { appearance: none; -webkit-appearance: none; }
  .stepper-bar { display: flex; align-items: center; gap: 0; background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 15%), oklch(from var(--background) l c h / 5%)); backdrop-filter: blur(8px); border-radius: 9999px; padding: 4px; position: relative; box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), 0 0.25em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%), 0 0 0 1px oklch(from var(--foreground) l c h / 10%); }
  .stepper-step { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; cursor: pointer; transition: all 0.3s cubic-bezier(0.25,1,0.5,1); font-size: 12px; font-weight: 500; white-space: nowrap; color: oklch(from var(--foreground) l c h / 35%); position: relative; }
  .stepper-step:hover { color: oklch(from var(--foreground) l c h / 70%); }
  .stepper-step.active { background: linear-gradient(-75deg, oklch(from var(--background) l c h / 12%), oklch(from var(--background) l c h / 28%), oklch(from var(--background) l c h / 12%)); color: oklch(from var(--foreground) l c h / 95%); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), 0 0.15em 0.25em oklch(from var(--foreground) l c h / 15%), 0 0 0 1px oklch(from var(--foreground) l c h / 12%); }
  .stepper-step.done { color: oklch(from var(--foreground) l c h / 55%); }
  .stepper-step.done:hover { color: oklch(from var(--foreground) l c h / 80%); }
  .stepper-num { width: 18px; height: 18px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; background: oklch(from var(--foreground) l c h / 10%); transition: all 0.3s ease; }
  .stepper-step.active .stepper-num { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
  .stepper-step.done .stepper-num { background: oklch(from var(--foreground) l c h / 20%); }
  .stepper-divider { width: 16px; height: 1px; background: oklch(from var(--foreground) l c h / 12%); flex-shrink: 0; margin: 0 2px; }
`;

type OnboardingStep =
  | "login"
  | "basics"
  | "workExperience"
  | "jobPreferences"
  | "resumeRevamp"
  | "submitted";

const STEPS: OnboardingStep[] = [
  "login",
  "basics",
  "workExperience",
  "jobPreferences",
  "resumeRevamp",
  "submitted",
];

/** Wider column, responsive; parent uses flex + justify-center to center each step */
const STEP_OUTER =
  "relative z-10 flex w-full min-w-0 max-w-2xl flex-col items-center mx-auto p-4 px-6 sm:px-8";

const TEXT_LOOP_INTERVAL = 1.5;

const submittingSteps = [
  {
    message: "Creating your profile...",
    icon: <Loader className="w-12 h-12 text-primary animate-spin" />,
  },
  {
    message: "Analyzing your experience...",
    icon: <Loader className="w-12 h-12 text-primary animate-spin" />,
  },
  {
    message: "Matching with mentors...",
    icon: <Loader className="w-12 h-12 text-primary animate-spin" />,
  },
];

interface GlassInputProps {
  icon?: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  label?: string;
  showLabel?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  rightSlot?: React.ReactNode;
  className?: string;
}

function GlassInput({
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
  label,
  showLabel,
  onKeyDown,
  inputRef,
  rightSlot,
  className,
}: GlassInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <AnimatePresence>
        {showLabel && label && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="absolute -top-6 left-4 z-10"
          >
            <label className="text-xs text-muted-foreground font-semibold">
              {label}
            </label>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="glass-input-wrap w-full">
        <div className="glass-input">
          {icon && (
            <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
              {icon}
            </div>
          )}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none"
          />
          {rightSlot && (
            <div className="relative z-10 flex-shrink-0 pr-1">{rightSlot}</div>
          )}
        </div>
      </div>
    </div>
  );
}

interface GlassSelectProps {
  icon?: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}

function GlassSelect({
  icon,
  placeholder,
  value,
  onChange,
  options,
  label,
}: GlassSelectProps) {
  return (
    <div className="relative w-full">
      {label && (
        <label className="absolute -top-6 left-4 z-10 text-xs text-muted-foreground font-semibold">
          {label}
        </label>
      )}
      <div className="glass-input-wrap w-full">
        <div className="glass-input">
          {icon && (
            <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
              {icon}
            </div>
          )}
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="glass-select relative z-10 h-full w-0 flex-grow bg-transparent text-foreground focus:outline-none py-3 pr-2 cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option
              value=""
              disabled
              style={{ background: "hsl(var(--card))" }}
            >
              {placeholder}
            </option>
            {options.map((o) => (
              <option
                key={o.value}
                value={o.value}
                style={{ background: "hsl(var(--card))" }}
              >
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function SubmittedScreen({ email }: { email: string }) {
  const words = ["Our", "team", "will", "reach", "out", "shortly."];

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 24, opacity: 0, filter: "blur(8px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.55, ease: [0.25, 1, 0.5, 1] },
    },
  };

  const wordVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: 0.85 + i * 0.07, duration: 0.4, ease: "easeOut" },
    }),
  };

  const ringVariants: Variants = {
    hidden: { scale: 0.6, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
    },
  };

  const iconVariants: Variants = {
    hidden: { scale: 0, rotate: -20, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: { delay: 0.15, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] },
    },
  };

  const checkmarkVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { delay: 0.5, duration: 0.5, ease: "easeInOut" },
    },
  };

  const floatVariants: Variants = {
    animate: {
      y: [0, -8, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const pulseVariants: Variants = {
    animate: {
      scale: [1, 1.12, 1],
      opacity: [0.35, 0.15, 0.35],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const orb1Variants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay: 0.2, duration: 0.8, ease: "easeOut" },
    },
    animate: {
      x: [0, 6, -4, 0],
      y: [0, -8, 4, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const orb2Variants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay: 0.35, duration: 0.8, ease: "easeOut" },
    },
    animate: {
      x: [0, -5, 7, 0],
      y: [0, 6, -6, 0],
      transition: {
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1,
      },
    },
  };

  return (
    <motion.div
      key="submitted"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn(STEP_OUTER, "gap-10 text-center")}
    >
      <motion.div
        variants={itemVariants}
        className="relative flex items-center justify-center"
      >
        <motion.div
          variants={orb1Variants}
          animate="animate"
          className="absolute w-48 h-48 rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <motion.div
          variants={orb2Variants}
          animate="animate"
          className="absolute w-32 h-32 rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent) / 0.3) 0%, transparent 70%)",
            filter: "blur(16px)",
            transform: "translate(30px, 20px)",
          }}
        />

        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="absolute w-36 h-36 rounded-full border"
          style={{ borderColor: "hsl(var(--primary) / 0.4)" }}
        />
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="absolute w-28 h-28 rounded-full border"
          style={{
            borderColor: "hsl(var(--primary) / 0.5)",
            animationDelay: "0.4s",
          }}
        />

        <motion.div
          variants={ringVariants}
          className="relative w-24 h-24 rounded-full"
          style={{
            background:
              "linear-gradient(-75deg, oklch(from var(--background) l c h / 8%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 8%))",
            boxShadow:
              "inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), 0 0 0 1px oklch(from var(--foreground) l c h / 12%), 0 0.5em 2em oklch(from var(--primary) l c h / 0.3)",
          }}
        >
          <motion.div
            variants={iconVariants}
            className="w-full h-full flex items-center justify-center"
          >
            <motion.div variants={floatVariants} animate="animate">
              <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
                <motion.circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  variants={checkmarkVariants}
                  style={{ pathLength: 0 }}
                />
                <motion.path
                  d="M13 20.5l5 5 9-10"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={checkmarkVariants}
                  style={{ pathLength: 0 }}
                />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="flex flex-col items-center gap-5">
        <motion.p
          variants={itemVariants}
          className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground"
        >
          You're in!
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-x-2 gap-y-0"
          initial="hidden"
          animate="visible"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={wordVariants}
              className="text-2xl font-light text-foreground/70 tracking-tight"
              style={{ fontFamily: "var(--app-font-serif)" }}
            >
              {word}
            </motion.span>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            We're reviewing your profile and will send you a tailored resume
            strategy within{" "}
            <span className="text-foreground font-medium">24 hours</span>.
          </p>
          {email && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="text-xs text-muted-foreground/60"
            >
              Confirmation sent to{" "}
              <span className="text-foreground/70 font-medium">{email}</span>
            </motion.p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "hsl(var(--primary))" }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

const MentorqueLogo = () => (
  <img
    src="/mentorque-logo.png"
    alt=""
    width={32}
    height={32}
    className="h-8 w-8 shrink-0 rounded-md object-cover invert opacity-95"
  />
);

export function OnboardingFlow() {
  const [step, setStep] = useState<OnboardingStep>(() => {
    // If URL hash is #result or #questions, jump to resumeRevamp step
    if (
      typeof window !== "undefined" &&
      (window.location.hash === "#result" ||
        window.location.hash === "#questions")
    ) {
      return "resumeRevamp";
    }
    return "login";
  });
  const [modalStatus, setModalStatus] = useState<"closed" | "loading">(
    "closed",
  );
  const confettiRef = useRef<ConfettiRef>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [impact, setImpact] = useState("");
  const [revenueImpact, setRevenueImpact] = useState("");
  const [topStat, setTopStat] = useState("");

  const [targetRole, setTargetRole] = useState("");
  const [country, setCountry] = useState("");
  const [seniority, setSeniority] = useState("");
  const [workStyle, setWorkStyle] = useState("");

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);

  const fireSideCanons = () => {
    const fire = confettiRef.current?.fire;
    if (fire) {
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 100,
      };
      fire({
        ...defaults,
        particleCount: 60,
        origin: { x: 0, y: 1 },
        angle: 60,
      });
      fire({
        ...defaults,
        particleCount: 60,
        origin: { x: 1, y: 1 },
        angle: 120,
      });
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      // 1. Open Google Popup
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // 2. Sync with Backend
      // Note: We use a raw fetch here because we are establishing the session.
      // Once synced, your API client handles the rest of the app's requests.
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Server synchronization failed");
      }

      const data = await response.json();

      // 3. Store the Drizzle User in Global State
      setAuth(data.user, idToken);

      // 4. Move to the next UI step
      setStep("basics");
    } catch (err: any) {
      console.error("Login error:", err);
      // Handle closed popups gracefully
      if (err.code !== "auth/popup-closed-by-user") {
        setLoginError(err.message || "Authentication failed");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const canProceedBasics =
    firstName.trim() && lastName.trim() && location.trim();
  const canProceedWork =
    company.trim() && jobTitle.trim() && teamSize && yearsExp;
  const canProceedPrefs =
    targetRole.trim() && country.trim() && seniority && workStyle;

  const currentStepIndex = STEPS.indexOf(step);

  const handleFinalSubmit = () => {
    setModalStatus("loading");
    const totalDuration = submittingSteps.length * TEXT_LOOP_INTERVAL * 1000;
    setTimeout(() => {
      fireSideCanons();
      setModalStatus("closed");
      setStep("submitted");
    }, totalDuration);
  };

  const Modal = () => (
    <AnimatePresence>
      {modalStatus !== "closed" && (
        <motion.div
          key="submit-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1000] flex min-h-[100dvh] w-screen items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Saving your profile"
        >
          <div
            className="absolute inset-0 bg-background/95 backdrop-blur-md"
            aria-hidden
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="relative z-10 w-full max-w-sm rounded-2xl border-4 border-border bg-card p-8 shadow-2xl flex flex-col items-center gap-4"
          >
            {modalStatus === "loading" && (
              <TextLoop interval={TEXT_LOOP_INTERVAL} stopOnEnd={true}>
                {submittingSteps.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-4">
                    {s.icon}
                    <p className="text-lg font-medium text-foreground text-center">
                      {s.message}
                    </p>
                  </div>
                ))}
              </TextLoop>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const STEP_META: { id: OnboardingStep; label: string }[] = [
    { id: "login", label: "Login" },
    { id: "basics", label: "Profile" },
    { id: "workExperience", label: "Experience" },
    { id: "jobPreferences", label: "Preferences" },
    { id: "resumeRevamp", label: "Revamp" },
  ];

  return (
    <div className="bg-background h-screen w-screen flex flex-col overflow-hidden">
      <style>{GLASS_STYLES}</style>

      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[990] h-full w-full"
      />
      <Modal />

      <div className="fixed top-4 left-4 z-20 flex items-center gap-2">
        <MentorqueLogo />
        <h1 className="text-base font-bold text-foreground">mentorque</h1>
      </div>

      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-20">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
            className="stepper-bar"
          >
            {STEP_META.map((s, i) => {
              const stepIdx = STEPS.indexOf(s.id);
              const isActive =
                step === s.id ||
                (step === "submitted" && i === STEP_META.length - 1);
              const isDone = currentStepIndex > stepIdx;
              return (
                <React.Fragment key={s.id}>
                  {i > 0 && <div className="stepper-divider" />}
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={cn("stepper-step", {
                      active: isActive,
                      done: isDone && !isActive,
                    })}
                  >
                    <span className="stepper-num">
                      {isDone && !isActive ? (
                        <svg
                          viewBox="0 0 12 12"
                          className="w-3 h-3"
                          fill="none"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span>{s.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "flex w-full flex-1 min-h-0 bg-card",
          step === "resumeRevamp"
            ? "items-stretch justify-start"
            : "items-center justify-center",
          "relative overflow-hidden",
        )}
      >
        <div className="absolute inset-0 z-0">
          <GradientBackground />
        </div>

        <AnimatePresence mode="wait">
          {/* ... (keep other steps) */}
          {step === "login" && (
            <motion.div
              key="login"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={cn(STEP_OUTER, "gap-8")}
            >
              <div className="w-full flex flex-col items-center gap-4 text-center mt-12">
                <BlurFade delay={0.1} className="w-full">
                  <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground whitespace-nowrap">
                    Land your dream job
                  </p>
                </BlurFade>
                <BlurFade delay={0.2}>
                  <p className="text-sm font-medium text-muted-foreground">
                    We craft the resume that gets you in the room.
                  </p>
                </BlurFade>
              </div>

              <div className="w-full max-w-xs mt-10 space-y-4">
                <BlurFade delay={0.3} className="w-full">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="glass-button w-full relative flex items-center justify-center gap-3 px-6 py-4 rounded-full overflow-hidden transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isLoggingIn ? (
                      <Loader className="w-5 h-5 animate-spin text-foreground/80" />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    <span className="glass-button-text text-sm font-semibold tracking-wide">
                      {isLoggingIn
                        ? "Authenticating..."
                        : "Continue with Google"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {loginError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-500 text-xs text-center mt-4 absolute w-full left-0"
                      >
                        {loginError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </BlurFade>
              </div>
            </motion.div>
          )}

          {step === "basics" && (
            <motion.div
              key="basics"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={cn(STEP_OUTER, "gap-8")}
            >
              <div className="w-full flex flex-col items-center gap-3">
                <BlurFade delay={0.05} className="w-full">
                  <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground text-center">
                    Tell us about you
                  </p>
                </BlurFade>
                <BlurFade delay={0.1}>
                  <p className="text-sm font-medium text-muted-foreground text-center">
                    Basic info so we can personalize your experience
                  </p>
                </BlurFade>
              </div>

              <div className="w-full space-y-8">
                <BlurFade delay={0.15} className="w-full">
                  <div className="flex gap-3">
                    <GlassInput
                      icon={<User className="h-5 w-5 text-foreground/80" />}
                      placeholder="First name"
                      value={firstName}
                      onChange={setFirstName}
                      label="First name"
                      showLabel={firstName.length > 0}
                    />
                    <GlassInput
                      placeholder="Last name"
                      value={lastName}
                      onChange={setLastName}
                      label="Last name"
                      showLabel={lastName.length > 0}
                    />
                  </div>
                </BlurFade>

                <BlurFade delay={0.2} className="w-full">
                  <GlassInput
                    icon={<MapPin className="h-5 w-5 text-foreground/80" />}
                    placeholder="City, Country"
                    value={location}
                    onChange={setLocation}
                    label="Location"
                    showLabel={location.length > 0}
                  />
                </BlurFade>

                <BlurFade delay={0.25} className="w-full">
                  <GlassInput
                    icon={
                      <svg
                        className="h-5 w-5 text-foreground/80"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    }
                    placeholder="LinkedIn profile URL"
                    value={linkedin}
                    onChange={setLinkedin}
                    label="LinkedIn"
                    showLabel={linkedin.length > 0}
                  />
                </BlurFade>

                <BlurFade delay={0.3} className="w-full">
                  <div className="flex justify-end">
                    <GlassButton
                      type="button"
                      onClick={() => setStep("workExperience")}
                      disabled={!canProceedBasics}
                      contentClassName="flex items-center gap-2"
                      className={cn(
                        "transition-opacity",
                        !canProceedBasics && "opacity-40",
                      )}
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </GlassButton>
                  </div>
                </BlurFade>
              </div>


            </motion.div>
          )}

          {step === "workExperience" && (
            <motion.div
              key="workExperience"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={cn(
                STEP_OUTER,
                "gap-8 max-h-screen overflow-y-auto py-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
              )}
            >
              <div className="w-full flex flex-col items-center gap-3">
                <BlurFade delay={0.05} className="w-full">
                  <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground text-center">
                    Your work story
                  </p>
                </BlurFade>
                <BlurFade delay={0.1}>
                  <p className="text-sm font-medium text-muted-foreground text-center">
                    The details that make your resume stand out
                  </p>
                </BlurFade>
              </div>

              <div className="w-full space-y-8">
                <BlurFade delay={0.12} className="w-full">
                  <GlassInput
                    icon={<Building2 className="h-5 w-5 text-foreground/80" />}
                    placeholder="Current / most recent company"
                    value={company}
                    onChange={setCompany}
                    label="Company"
                    showLabel={company.length > 0}
                  />
                </BlurFade>

                <BlurFade delay={0.16} className="w-full">
                  <GlassInput
                    icon={<Briefcase className="h-5 w-5 text-foreground/80" />}
                    placeholder="Your job title"
                    value={jobTitle}
                    onChange={setJobTitle}
                    label="Job title"
                    showLabel={jobTitle.length > 0}
                  />
                </BlurFade>

                <BlurFade delay={0.2} className="w-full">
                  <div className="flex gap-3">
                    <GlassSelect
                      icon={
                        <TrendingUp className="h-5 w-5 text-foreground/80" />
                      }
                      placeholder="Years of exp."
                      value={yearsExp}
                      onChange={setYearsExp}
                      options={[
                        { value: "0-1", label: "0–1 years" },
                        { value: "1-3", label: "1–3 years" },
                        { value: "3-5", label: "3–5 years" },
                        { value: "5-8", label: "5–8 years" },
                        { value: "8-12", label: "8–12 years" },
                        { value: "12+", label: "12+ years" },
                      ]}
                      label="Experience"
                    />
                    <GlassSelect
                      icon={<Users className="h-5 w-5 text-foreground/80" />}
                      placeholder="Team size"
                      value={teamSize}
                      onChange={setTeamSize}
                      options={[
                        { value: "1", label: "Solo" },
                        { value: "2-5", label: "2–5" },
                        { value: "6-10", label: "6–10" },
                        { value: "11-25", label: "11–25" },
                        { value: "26-50", label: "26–50" },
                        { value: "50+", label: "50+" },
                      ]}
                      label="Team size"
                    />
                  </div>
                </BlurFade>

                <BlurFade delay={0.24} className="w-full">
                  <div className="relative w-full">
                    {impact.length > 0 && (
                      <label className="absolute -top-6 left-4 z-10 text-xs text-muted-foreground font-semibold">
                        Key impact (e.g. "Reduced churn by 30%")
                      </label>
                    )}
                    <div className="glass-textarea-wrap w-full">
                      <div className="glass-textarea">
                        <div className="relative z-10 flex-shrink-0 flex items-start justify-center w-10 pl-2 pt-3">
                          <Target className="h-5 w-5 text-foreground/80" />
                        </div>
                        <textarea
                          placeholder='Key impact — e.g. "Led migration that cut latency by 40%"'
                          value={impact}
                          onChange={(e) => setImpact(e.target.value)}
                          rows={3}
                          className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none resize-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                        />
                      </div>
                    </div>
                  </div>
                </BlurFade>

                <BlurFade delay={0.28} className="w-full">
                  <GlassInput
                    icon={<TrendingUp className="h-5 w-5 text-foreground/80" />}
                    placeholder="Revenue / cost impact (e.g. $2M ARR)"
                    value={revenueImpact}
                    onChange={setRevenueImpact}
                    label="Revenue / cost impact"
                    showLabel={revenueImpact.length > 0}
                  />
                </BlurFade>

                <BlurFade delay={0.32} className="w-full">
                  <GlassInput
                    icon={<TrendingUp className="h-5 w-5 text-foreground/80" />}
                    placeholder="Your proudest metric (e.g. 99.9% uptime)"
                    value={topStat}
                    onChange={setTopStat}
                    label="Top achievement stat"
                    showLabel={topStat.length > 0}
                  />
                </BlurFade>

                <BlurFade delay={0.36} className="w-full">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setStep("basics")}
                      className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Go back
                    </button>
                    <GlassButton
                      type="button"
                      onClick={() => setStep("jobPreferences")}
                      disabled={!canProceedWork}
                      contentClassName="flex items-center gap-2"
                      className={cn(
                        "transition-opacity",
                        !canProceedWork && "opacity-40",
                      )}
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </GlassButton>
                  </div>
                </BlurFade>
              </div>
            </motion.div>
          )}

          {step === "jobPreferences" && (
            <motion.div
              key="jobPreferences"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={cn(
                STEP_OUTER,
                "gap-8 max-h-screen overflow-y-auto py-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
              )}
            >
              <div className="w-full flex flex-col items-center gap-3">
                <BlurFade delay={0.05} className="w-full">
                  <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground text-center">
                    Where are you headed?
                  </p>
                </BlurFade>
                <BlurFade delay={0.1}>
                  <p className="text-sm font-medium text-muted-foreground text-center">
                    We tailor your resume for your target role
                  </p>
                </BlurFade>
              </div>

              <div className="w-full space-y-8">
                <BlurFade delay={0.15} className="w-full">
                  <GlassInput
                    icon={<Target className="h-5 w-5 text-foreground/80" />}
                    placeholder="Target role (e.g. Staff Engineer)"
                    value={targetRole}
                    onChange={setTargetRole}
                    label="Target role"
                    showLabel={targetRole.length > 0}
                  />
                </BlurFade>

                <BlurFade delay={0.2} className="w-full">
                  <GlassInput
                    icon={<Globe className="h-5 w-5 text-foreground/80" />}
                    placeholder="Target country (e.g. United States)"
                    value={country}
                    onChange={setCountry}
                    label="Target country"
                    showLabel={country.length > 0}
                  />
                </BlurFade>

                <BlurFade delay={0.25} className="w-full">
                  <GlassSelect
                    icon={<TrendingUp className="h-5 w-5 text-foreground/80" />}
                    placeholder="Seniority level"
                    value={seniority}
                    onChange={setSeniority}
                    options={[
                      { value: "intern", label: "Intern" },
                      { value: "entry", label: "Entry level" },
                      { value: "mid", label: "Mid level" },
                      { value: "senior", label: "Senior" },
                      { value: "staff", label: "Staff / Principal" },
                      { value: "lead", label: "Lead / Manager" },
                      { value: "director", label: "Director+" },
                    ]}
                    label="Seniority"
                  />
                </BlurFade>

                <BlurFade delay={0.3} className="w-full">
                  <div className="flex gap-3">
                    {["Remote", "Hybrid", "On-site"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setWorkStyle(opt.toLowerCase().replace("-", ""))
                        }
                        className={cn(
                          "flex-1 py-3 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden",
                          workStyle === opt.toLowerCase().replace("-", "")
                            ? "text-foreground"
                            : "text-foreground/50 hover:text-foreground/80",
                        )}
                        style={{
                          background:
                            workStyle === opt.toLowerCase().replace("-", "")
                              ? "linear-gradient(-75deg, oklch(from var(--background) l c h / 15%), oklch(from var(--background) l c h / 30%), oklch(from var(--background) l c h / 15%))"
                              : "linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 10%), oklch(from var(--background) l c h / 5%))",
                          boxShadow:
                            workStyle === opt.toLowerCase().replace("-", "")
                              ? "inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), 0 0.25em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%)"
                              : "inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 2%)",
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </BlurFade>

                <BlurFade delay={0.35} className="w-full">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setStep("workExperience")}
                      className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Go back
                    </button>
                    <GlassButton
                      type="button"
                      onClick={() => setStep("resumeRevamp")}
                      disabled={!canProceedPrefs}
                      contentClassName="flex items-center gap-2"
                      className={cn(
                        "transition-opacity",
                        !canProceedPrefs && "opacity-40",
                      )}
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </GlassButton>
                  </div>
                </BlurFade>
              </div>
            </motion.div>
          )}

          {step === "submitted" && (
            <SubmittedScreen email={user?.email || ""} />
          )}
          {step === "resumeRevamp" && (
            <motion.div
              key="resumeRevamp"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative z-10 flex w-full max-w-[1600px] h-full flex-col mx-auto px-6 pt-20 pb-2 overflow-hidden"
            >
              <ResumeRevampStep
                onComplete={(finalResumeData) => {
                  // Trigger the final submission flow
                  handleFinalSubmit();
                }}
                apiBaseUrl=""
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
