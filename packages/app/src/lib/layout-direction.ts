/**
 * Pointer deltas are physical (screen X), but sidebars and resize handles sit on
 * the logical start/end side. In right-to-left layouts the sides swap, so a drag
 * delta must be mirrored to grow the panel the way the user is pulling it.
 */
export function horizontalDragSign(element?: Element | null) {
  const target = element ?? (typeof document === "undefined" ? null : document.documentElement);
  if (!target || typeof getComputedStyle !== "function") return 1;

  return getComputedStyle(target).direction === "rtl" ? -1 : 1;
}
