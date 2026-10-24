import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";

// Load Motion's layout/gesture features after startup so they stay out of the first paint.
const loadMotionFeatures = () => import("./motion-features").then((module) => module.default);

export const springs = {
  layout: { type: "spring", visualDuration: 0.32, bounce: 0.12 },
  snappy: { type: "spring", visualDuration: 0.22, bounce: 0.18 },
  soft: { type: "spring", visualDuration: 0.4, bounce: 0.22 }
} as const;

export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user" transition={springs.layout}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

/** +1 in left-to-right layouts, -1 in right-to-left ones, for horizontal motion. */
export function readingDirectionSign() {
  if (typeof document === "undefined") return 1;
  return getComputedStyle(document.documentElement).direction === "rtl" ? -1 : 1;
}
