import { debug } from "@helbaron/shared";

let performanceMeasureId = 0;

type PerformanceMeasureDetail = Record<string, unknown>;

function getPerformanceTarget() {
  return typeof globalThis.performance === "undefined" ? null : globalThis.performance;
}

export function markAppPerformance(name: string, detail: PerformanceMeasureDetail = {}) {
  const performanceTarget = getPerformanceTarget();
  const markName = `helbaron:${name}`;

  try {
    performanceTarget?.mark(markName);
  } catch {
    return;
  }

  debug(() => ["[helbaron-performance] mark", {
    ...detail,
    name
  }]);
}

export function startAppPerformanceMeasure(name: string, detail: PerformanceMeasureDetail = {}) {
  const performanceTarget = getPerformanceTarget();
  performanceMeasureId += 1;
  const id = performanceMeasureId;
  const startMark = `helbaron:${name}:start:${id}`;
  const endMark = `helbaron:${name}:end:${id}`;
  const measureName = `helbaron:${name}`;
  const startedAt = performanceTarget?.now?.() ?? Date.now();

  try {
    performanceTarget?.mark(startMark);
  } catch {
    // Performance marks are diagnostic only.
  }

  return () => {
    const endedAt = performanceTarget?.now?.() ?? Date.now();

    try {
      performanceTarget?.mark(endMark);
      performanceTarget?.measure(measureName, startMark, endMark);
    } catch {
      // Performance marks are diagnostic only.
    }

    debug(() => ["[helbaron-performance] measure", {
      ...detail,
      durationMs: Math.max(0, endedAt - startedAt),
      name
    }]);
  };
}

export function measureAppPerformance<T>(
  name: string,
  callback: () => T,
  detail: PerformanceMeasureDetail = {}
) {
  const finish = startAppPerformanceMeasure(name, detail);

  try {
    return callback();
  } finally {
    finish();
  }
}

export async function measureAppPerformanceAsync<T>(
  name: string,
  callback: () => Promise<T>,
  detail: PerformanceMeasureDetail = {}
) {
  const finish = startAppPerformanceMeasure(name, detail);

  try {
    return await callback();
  } finally {
    finish();
  }
}
