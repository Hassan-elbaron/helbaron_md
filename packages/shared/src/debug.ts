export type DebugLogFactory = () => readonly [message: string, details?: unknown];

declare const __HELBARON_DEBUG__: boolean;

export function debug(factory: DebugLogFactory) {
  if (typeof __HELBARON_DEBUG__ === "undefined" || !__HELBARON_DEBUG__) return;

  const [message, details] = factory();
  if (details === undefined) {
    console.debug(message);
    return;
  }

  console.debug(message, details);
}
