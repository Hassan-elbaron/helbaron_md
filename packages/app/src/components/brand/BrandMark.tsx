import { useEffect, useId, useMemo, useState } from "react";
import { brandMarkSvgTemplate } from "./brand-mark-svg";

export type BrandMarkMode = "idle" | "busy" | "launch" | "static";

type BrandMarkProps = {
  className?: string;
  label?: string;
  mode?: BrandMarkMode;
  size?: number;
};

/**
 * The El Baron compass mark, animated with CSS (brand-motion.css):
 * idle — the points drift round slowly and the red dot breathes;
 * busy — the points spin and the dot pulses (work in progress);
 * launch — the compass calibrates once (the start-up flash).
 */
export function BrandMark({ className = "", label, mode = "idle", size = 22 }: BrandMarkProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/gu, "");
  const markup = useMemo(() => brandMarkSvgTemplate.replaceAll("__", `-${id}`), [id]);

  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={`hb-brand ${className}`}
      data-mode={mode}
      dangerouslySetInnerHTML={{ __html: markup }}
      height={size}
      role={label ? "img" : undefined}
      viewBox="0 0 2000 2000"
      width={size}
    />
  );
}

let launchShown = false;
const launchDurationMs = 1150;
const launchHoldMs = 180;
const launchFadeMs = 300;

/** One-time start-up flash: the compass calibrates, then the window is revealed. */
export function LaunchSplash() {
  const [phase, setPhase] = useState<"show" | "fade" | "done">(() => (launchShown ? "done" : "show"));

  useEffect(() => {
    if (phase === "done") return;
    launchShown = true;
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const visibleFor = reduced ? 350 : launchDurationMs + launchHoldMs;
    const fadeTimer = window.setTimeout(() => setPhase("fade"), visibleFor);
    const doneTimer = window.setTimeout(() => setPhase("done"), visibleFor + launchFadeMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
    // Runs once per window; the phase change itself must not restart the timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "done") return null;

  return (
    <div aria-hidden="true" className="hb-launch" data-phase={phase}>
      <div className="hb-launch-stack">
        <BrandMark mode="launch" size={132} />
        <div className="hb-launch-word"><b>HEl</b>baron</div>
      </div>
    </div>
  );
}
