import { flushSync } from "react-dom";

export type ViewTransitionKind = "theme" | "language" | "mode" | "tab";

type StartViewTransition = (callback: () => unknown) => { finished: Promise<unknown> };

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Runs a React state change inside a View Transition so the whole window
 * animates between the old and new look (theme reveal, language cross-fade,
 * view-mode morph). Falls back to a plain update where unsupported.
 */
export function runViewTransition(
  kind: ViewTransitionKind,
  update: () => unknown,
  origin?: { x: number; y: number }
) {
  const doc = typeof document === "undefined" ? null : document;
  const start = (doc as (Document & { startViewTransition?: StartViewTransition }) | null)?.startViewTransition;

  if (!doc || typeof start !== "function" || prefersReducedMotion()) {
    update();
    return;
  }

  const root = doc.documentElement;
  root.dataset.vt = kind;
  if (origin) {
    root.style.setProperty("--vt-x", `${origin.x}px`);
    root.style.setProperty("--vt-y", `${origin.y}px`);
  }

  try {
    const transition = start.call(doc, () => {
      flushSync(() => {
        update();
      });
    });
    transition.finished.finally(() => {
      if (root.dataset.vt === kind) delete root.dataset.vt;
    }).catch(() => {});
  } catch {
    delete root.dataset.vt;
    update();
  }
}

/** Centre of the element that triggered a transition, for the theme reveal circle. */
export function transitionOriginFromEvent(event?: { currentTarget?: EventTarget | null } | null) {
  const element = event?.currentTarget;
  if (!(element instanceof Element)) return undefined;

  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
