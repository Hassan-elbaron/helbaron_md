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
const launchHoldMs = 250;
const launchFadeMs = 320;
const bootSplashId = "hb-boot-splash";

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Start-up flash. The page HTML paints the animated logo on the very first frame
 * (#hb-boot-splash), before any script loads; once the app has mounted and the
 * compass has finished calibrating, this fades it out. Without that element
 * (tests, embedded views) it renders the same splash itself.
 */
export function LaunchSplash() {
  const [phase, setPhase] = useState<"show" | "fade" | "done">(() => {
    if (launchShown) return "done";
    return typeof document !== "undefined" && document.getElementById(bootSplashId) ? "done" : "show";
  });

  useEffect(() => {
    const boot = document.getElementById(bootSplashId);
    // Only the first mount of a window plays the flash; later mounts render nothing.
    if (launchShown && !boot) return;
    const minimumVisible = prefersReducedMotion() ? 600 : launchDurationMs + launchHoldMs;
    const elapsed = typeof performance !== "undefined" ? performance.now() : 0;
    // Keep the flash up until its animation has played, however fast the app loaded.
    const remaining = boot ? Math.max(200, minimumVisible - elapsed) : minimumVisible;

    const fadeTimer = window.setTimeout(() => {
      if (boot) boot.dataset.phase = "fade";
      else setPhase("fade");
    }, remaining);
    const doneTimer = window.setTimeout(() => {
      launchShown = true;
      if (boot) boot.remove();
      else setPhase("done");
    }, remaining + launchFadeMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
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
