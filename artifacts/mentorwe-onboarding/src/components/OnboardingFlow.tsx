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
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  X,
  AlertCircle,
  PartyPopper,
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
    [globalOptions]
  );
  const fire = useCallback(
    (opts = {}) => instanceRef.current?.({ ...options, ...opts }),
    [options]
  );
  const api = useMemo(() => ({ fire }), [fire]);
  useImperativeHandle(ref, () => api, [api]);
  useEffect(() => {
    if (!manualstart) fire();
  }, [manualstart, fire]);
  return <canvas ref={canvasRef} {...rest} />;
});
Confetti.displayName = "Confetti";

type TextLoopProps = {
  children: React.ReactNode[];
  className?: string;
  interval?: number;
  transition?: Transition;
  variants?: Variants;
  onIndexChange?: (index: number) => void;
  stopOnEnd?: boolean;
};
function TextLoop({
  children,
  className,
  interval = 2,
  transition = { duration: 0.3 },
  variants,
  onIndexChange,
  stopOnEnd = false,
}: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);
  useEffect(() => {
    const intervalMs = interval * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) {
          clearInterval(timer);
          return current;
        }
        const next = (current + 1) % items.length;
        onIndexChange?.(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, stopOnEnd]);
  const motionVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };
  return (
    <div className={cn("relative inline-block whitespace-nowrap", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentIndex}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          variants={variants || motionVariants}
        >
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: { hidden: { y: number }; visible: { y: number } };
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: string;
  blur?: string;
}
function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  inView = true,
  inViewMargin = "-50px",
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
  };
  const combinedVariants = variant || defaultVariants;
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      exit="hidden"
      variants={combinedVariants}
      transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const glassButtonVariants = cva(
  "relative isolate all-unset cursor-pointer rounded-full transition-all",
  {
    variants: {
      size: {
        default: "text-base font-medium",
        sm: "text-sm font-medium",
        lg: "text-lg font-medium",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { size: "default" },
  }
);
const glassButtonTextVariants = cva(
  "glass-button-text relative block select-none tracking-tighter",
  {
    variants: {
      size: {
        default: "px-6 py-3.5",
        sm: "px-4 py-2",
        lg: "px-8 py-4",
        icon: "flex h-10 w-10 items-center justify-center",
      },
    },
    defaultVariants: { size: "default" },
  }
);
interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
}
const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, onClick, ...props }, ref) => {
    const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const button = e.currentTarget.querySelector("button");
      if (button && e.target !== button) button.click();
    };
    return (
      <div
        className={cn(
          "glass-button-wrap cursor-pointer rounded-full relative",
          className
        )}
        onClick={handleWrapperClick}
      >
        <button
          className={cn(
            "glass-button relative z-10",
            glassButtonVariants({ size })
          )}
          ref={ref}
          onClick={onClick}
          {...props}
        >
          <span
            className={cn(glassButtonTextVariants({ size }), contentClassName)}
          >
            {children}
          </span>
        </button>
        <div className="glass-button-shadow rounded-full pointer-events-none"></div>
      </div>
    );
  }
);
GlassButton.displayName = "GlassButton";

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
        <linearGradient id="rev_grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{
              stopColor: "var(--color-primary)",
              stopOpacity: 0.8,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: "var(--color-chart-3)",
              stopOpacity: 0.6,
            }}
          />
        </linearGradient>
        <linearGradient id="rev_grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{
              stopColor: "var(--color-chart-4)",
              stopOpacity: 0.9,
            }}
          />
          <stop
            offset="50%"
            style={{
              stopColor: "var(--color-secondary)",
              stopOpacity: 0.7,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: "var(--color-chart-1)",
              stopOpacity: 0.6,
            }}
          />
        </linearGradient>
        <radialGradient id="rev_grad3" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            style={{
              stopColor: "var(--color-destructive)",
              stopOpacity: 0.8,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: "var(--color-chart-5)",
              stopOpacity: 0.4,
            }}
          />
        </radialGradient>
        <filter
          id="rev_blur1"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="35" />
        </filter>
        <filter
          id="rev_blur2"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="25" />
        </filter>
        <filter
          id="rev_blur3"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
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
          fill="var(--color-accent)"
          filter="url(#rev_blur2)"
          opacity="0.8"
        />
      </g>
    </svg>
  </>
);

const GLASS_STYLES = `
  input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; }
  input[type="password"]::-webkit-credentials-auto-fill-button, input[type="password"]::-webkit-strong-password-auto-fill-button { display: none !important; }
  input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px transparent inset !important; -webkit-text-fill-color: var(--foreground) !important; background-color: transparent !important; background-clip: content-box !important; transition: background-color 5000s ease-in-out 0s !important; color: var(--foreground) !important; caret-color: var(--foreground) !important; }
  input:autofill { background-color: transparent !important; background-clip: content-box !important; -webkit-text-fill-color: var(--foreground) !important; color: var(--foreground) !important; }
  input:-internal-autofill-selected { background-color: transparent !important; background-image: none !important; color: var(--foreground) !important; -webkit-text-fill-color: var(--foreground) !important; }
  input:-webkit-autofill::first-line { color: var(--foreground) !important; -webkit-text-fill-color: var(--foreground) !important; }
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
  .glass-input input { padding: 0.75rem 0.25rem; }
  .glass-textarea-wrap { position: relative; z-index: 2; transform-style: preserve-3d; border-radius: 1rem; }
  .glass-textarea { display: flex; position: relative; width: 100%; align-items: flex-start; gap: 0.5rem; border-radius: 1rem; padding: 0.25rem; -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1); background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 5%)); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.25em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%), 0 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%); }
  .glass-textarea-wrap:focus-within .glass-textarea { box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.15em 0.05em -0.1em oklch(from var(--foreground) l c h / 25%), 0 0 0.05em 0.1em inset oklch(from var(--background) l c h / 50%); }
  .glass-textarea::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 1rem; width: calc(100% + clamp(1px, 0.0625em, 4px)); height: calc(100% + clamp(1px, 0.0625em, 4px)); top: calc(0% - clamp(1px, 0.0625em, 4px) / 2); left: calc(0% - clamp(1px, 0.0625em, 4px) / 2); padding: clamp(1px, 0.0625em, 4px); box-sizing: border-box; background: conic-gradient(from var(--angle-1) at 50% 50%, oklch(from var(--foreground) l c h / 50%) 0%, transparent 5% 40%, oklch(from var(--foreground) l c h / 50%) 50%, transparent 60% 95%, oklch(from var(--foreground) l c h / 50%) 100%), linear-gradient(180deg, oklch(from var(--background) l c h / 50%), oklch(from var(--background) l c h / 50%)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; pointer-events: none; }
  .glass-select { appearance: none; -webkit-appearance: none; }
  .step-indicator-dot { width: 6px; height: 6px; border-radius: 9999px; transition: all 0.3s ease; }
  .step-indicator-dot.active { width: 20px; background-color: oklch(from var(--foreground) l c h / 80%); }
  .step-indicator-dot.done { background-color: oklch(from var(--foreground) l c h / 50%); }
  .step-indicator-dot.upcoming { background-color: oklch(from var(--foreground) l c h / 20%); }
`;

type OnboardingStep =
  | "login"
  | "basics"
  | "workExperience"
  | "jobPreferences"
  | "submitted";

const STEPS: OnboardingStep[] = [
  "login",
  "basics",
  "workExperience",
  "jobPreferences",
  "submitted",
];

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
  {
    message: "You're all set!",
    icon: <PartyPopper className="w-12 h-12 text-green-500" />,
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
            <div className="relative z-10 flex-shrink-0 pr-1">
              {rightSlot}
            </div>
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
            <option value="" disabled style={{ background: "hsl(var(--card))" }}>
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

const MentorweLogo = () => (
  <div className="bg-primary text-primary-foreground rounded-md p-1.5">
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  </div>
);

export function OnboardingFlow() {
  const [step, setStep] = useState<OnboardingStep>("login");
  const [modalStatus, setModalStatus] = useState<
    "closed" | "loading" | "success"
  >("closed");
  const confettiRef = useRef<ConfettiRef>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginPhase, setLoginPhase] = useState<"email" | "password">("email");

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

  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 6;

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

  useEffect(() => {
    if (loginPhase === "password")
      setTimeout(() => passwordInputRef.current?.focus(), 500);
  }, [loginPhase]);

  const handleLoginProgress = () => {
    if (loginPhase === "email" && isEmailValid) {
      setLoginPhase("password");
    } else if (loginPhase === "password" && isPasswordValid) {
      setStep("basics");
    }
  };

  const handleLoginKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLoginProgress();
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
    const totalDuration =
      (submittingSteps.length - 1) * TEXT_LOOP_INTERVAL * 1000;
    setTimeout(() => {
      fireSideCanons();
      setModalStatus("success");
      setStep("submitted");
    }, totalDuration);
  };

  const Modal = () => (
    <AnimatePresence>
      {modalStatus !== "closed" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-card/80 border-4 border-border rounded-2xl p-8 w-full max-w-sm flex flex-col items-center gap-4 mx-4"
          >
            {modalStatus === "loading" && (
              <TextLoop interval={TEXT_LOOP_INTERVAL} stopOnEnd={true}>
                {submittingSteps.slice(0, -1).map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-4">
                    {s.icon}
                    <p className="text-lg font-medium text-foreground text-center">
                      {s.message}
                    </p>
                  </div>
                ))}
              </TextLoop>
            )}
            {modalStatus === "success" && (
              <div className="flex flex-col items-center gap-4">
                {submittingSteps[submittingSteps.length - 1].icon}
                <p className="text-lg font-medium text-foreground text-center">
                  {submittingSteps[submittingSteps.length - 1].message}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const stepDots = STEPS.filter((s) => s !== "submitted");

  return (
    <div className="bg-background min-h-screen w-screen flex flex-col">
      <style>{GLASS_STYLES}</style>

      <Confetti
        ref={confettiRef}
        manualstart
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]"
      />
      <Modal />

      <div
        className={cn(
          "fixed top-4 left-4 z-20 flex items-center gap-2",
          "md:left-1/2 md:-translate-x-1/2"
        )}
      >
        <MentorweLogo />
        <h1 className="text-base font-bold text-foreground">mentorwe</h1>
      </div>

      {step !== "submitted" && step !== "login" && (
        <div className="fixed top-4 right-4 z-20 flex items-center gap-1.5">
          {stepDots.map((s, i) => (
            <div
              key={s}
              className={cn("step-indicator-dot", {
                active: s === step,
                done: i < currentStepIndex,
                upcoming: i > currentStepIndex,
              })}
            />
          ))}
        </div>
      )}

      <div
        className={cn(
          "flex w-full flex-1 h-full items-center justify-center bg-card",
          "relative overflow-hidden"
        )}
      >
        <div className="absolute inset-0 z-0">
          <GradientBackground />
        </div>

        <AnimatePresence mode="wait">
          {step === "login" && (
            <motion.div
              key="login"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative z-10 flex flex-col items-center gap-8 w-[300px] mx-auto p-4"
            >
              <AnimatePresence mode="wait">
                {loginPhase === "email" && (
                  <motion.div
                    key="email-header"
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex flex-col items-center gap-4"
                  >
                    <BlurFade delay={0.1} className="w-full">
                      <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground text-center whitespace-nowrap">
                        Land your dream job
                      </p>
                    </BlurFade>
                    <BlurFade delay={0.2}>
                      <p className="text-sm font-medium text-muted-foreground text-center">
                        We craft the resume that gets you in the room.
                      </p>
                    </BlurFade>
                  </motion.div>
                )}
                {loginPhase === "password" && (
                  <motion.div
                    key="password-header"
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex flex-col items-center text-center gap-3"
                  >
                    <BlurFade delay={0} className="w-full">
                      <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground whitespace-nowrap">
                        Welcome back
                      </p>
                    </BlurFade>
                    <BlurFade delay={0.1}>
                      <p className="text-sm font-medium text-muted-foreground">
                        Enter your password to continue
                      </p>
                    </BlurFade>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full space-y-6">
                <BlurFade
                  delay={loginPhase === "email" ? 0.3 : 0}
                  className="w-full"
                >
                  <div className="relative w-full">
                    <AnimatePresence>
                      {loginPhase === "password" && (
                        <motion.div
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.3 }}
                          className="absolute -top-6 left-4 z-10"
                        >
                          <label className="text-xs text-muted-foreground font-semibold">
                            Email
                          </label>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="glass-input-wrap w-full">
                      <div className="glass-input">
                        <div
                          className={cn(
                            "relative z-10 flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out",
                            email.length > 20 && loginPhase === "email"
                              ? "w-0 px-0"
                              : "w-10 pl-2"
                          )}
                        >
                          <Mail className="h-5 w-5 text-foreground/80 flex-shrink-0" />
                        </div>
                        <input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={handleLoginKeyDown}
                          className={cn(
                            "relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none transition-[padding-right] duration-300 ease-in-out delay-300",
                            isEmailValid && loginPhase === "email"
                              ? "pr-2"
                              : "pr-0"
                          )}
                        />
                        <div
                          className={cn(
                            "relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
                            isEmailValid && loginPhase === "email"
                              ? "w-10 pr-1"
                              : "w-0"
                          )}
                        >
                          <GlassButton
                            type="button"
                            onClick={handleLoginProgress}
                            size="icon"
                            contentClassName="text-foreground/80 hover:text-foreground"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </GlassButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </BlurFade>

                <AnimatePresence>
                  {loginPhase === "password" && (
                    <BlurFade key="pw" className="w-full">
                      <div className="relative w-full">
                        <AnimatePresence>
                          {password.length > 0 && (
                            <motion.div
                              initial={{ y: -10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className="absolute -top-6 left-4 z-10"
                            >
                              <label className="text-xs text-muted-foreground font-semibold">
                                Password
                              </label>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="glass-input-wrap w-full">
                          <div className="glass-input">
                            <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                              {isPasswordValid ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPassword(!showPassword)
                                  }
                                  className="text-foreground/80 hover:text-foreground transition-colors p-2 rounded-full"
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                  ) : (
                                    <Eye className="w-5 h-5" />
                                  )}
                                </button>
                              ) : (
                                <Lock className="h-5 w-5 text-foreground/80 flex-shrink-0" />
                              )}
                            </div>
                            <input
                              ref={passwordInputRef}
                              type={showPassword ? "text" : "password"}
                              placeholder="Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onKeyDown={handleLoginKeyDown}
                              className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none"
                            />
                            <div
                              className={cn(
                                "relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
                                isPasswordValid ? "w-10 pr-1" : "w-0"
                              )}
                            >
                              <GlassButton
                                type="button"
                                onClick={handleLoginProgress}
                                size="icon"
                                contentClassName="text-foreground/80 hover:text-foreground"
                              >
                                <ArrowRight className="w-5 h-5" />
                              </GlassButton>
                            </div>
                          </div>
                        </div>
                      </div>
                      <BlurFade inView delay={0.2}>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginPhase("email");
                            setPassword("");
                          }}
                          className="mt-4 flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" /> Go back
                        </button>
                      </BlurFade>
                    </BlurFade>
                  )}
                </AnimatePresence>
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
              className="relative z-10 flex flex-col items-center gap-8 w-[340px] mx-auto p-4"
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
                        !canProceedBasics && "opacity-40"
                      )}
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </GlassButton>
                  </div>
                </BlurFade>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep("login");
                  setLoginPhase("password");
                }}
                className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Go back
              </button>
            </motion.div>
          )}

          {step === "workExperience" && (
            <motion.div
              key="workExperience"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative z-10 flex flex-col items-center gap-8 w-[340px] mx-auto p-4 max-h-screen overflow-y-auto py-20"
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
                    icon={
                      <Building2 className="h-5 w-5 text-foreground/80" />
                    }
                    placeholder="Current / most recent company"
                    value={company}
                    onChange={setCompany}
                    label="Company"
                    showLabel={company.length > 0}
                  />
                </BlurFade>

                <BlurFade delay={0.16} className="w-full">
                  <GlassInput
                    icon={
                      <Briefcase className="h-5 w-5 text-foreground/80" />
                    }
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
                      icon={<TrendingUp className="h-5 w-5 text-foreground/80" />}
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
                          className="relative z-10 w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none resize-none py-3 pr-3 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </BlurFade>

                <BlurFade delay={0.28} className="w-full">
                  <GlassInput
                    icon={
                      <TrendingUp className="h-5 w-5 text-foreground/80" />
                    }
                    placeholder="Revenue / cost impact (e.g. $2M ARR)"
                    value={revenueImpact}
                    onChange={setRevenueImpact}
                    label="Revenue / cost impact"
                    showLabel={revenueImpact.length > 0}
                  />
                </BlurFade>

                <BlurFade delay={0.32} className="w-full">
                  <GlassInput
                    icon={
                      <TrendingUp className="h-5 w-5 text-foreground/80" />
                    }
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
                        !canProceedWork && "opacity-40"
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
              className="relative z-10 flex flex-col items-center gap-8 w-[340px] mx-auto p-4 max-h-screen overflow-y-auto py-20"
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
                        onClick={() => setWorkStyle(opt.toLowerCase().replace("-", ""))}
                        className={cn(
                          "flex-1 py-3 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden",
                          workStyle === opt.toLowerCase().replace("-", "")
                            ? "text-foreground"
                            : "text-foreground/50 hover:text-foreground/80"
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
                      onClick={handleFinalSubmit}
                      disabled={!canProceedPrefs}
                      contentClassName="flex items-center gap-2"
                      className={cn(
                        "transition-opacity",
                        !canProceedPrefs && "opacity-40"
                      )}
                    >
                      Submit <ArrowRight className="w-4 h-4" />
                    </GlassButton>
                  </div>
                </BlurFade>
              </div>
            </motion.div>
          )}

          {step === "submitted" && (
            <motion.div
              key="submitted"
              initial={{ y: 10, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="relative z-10 flex flex-col items-center gap-8 w-[340px] mx-auto p-4 text-center"
            >
              <BlurFade delay={0.3}>
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(-75deg, oklch(from var(--background) l c h / 10%), oklch(from var(--background) l c h / 25%), oklch(from var(--background) l c h / 10%))",
                      boxShadow: "inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), 0 0.25em 0.5em oklch(from var(--foreground) l c h / 15%)",
                    }}
                  >
                    <PartyPopper className="w-10 h-10 text-primary" />
                  </div>
                  <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground">
                    You're in!
                  </p>
                  <p className="text-base text-muted-foreground max-w-xs leading-relaxed">
                    Our team is reviewing your profile. We'll reach out within{" "}
                    <span className="text-foreground font-medium">24 hours</span>{" "}
                    with your personalized resume strategy.
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Check your inbox at{" "}
                    <span className="text-foreground/80 font-medium">{email}</span>
                  </p>
                </div>
              </BlurFade>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
