type MetricValue = number | string | boolean;

declare global {
  interface Window {
    __strandMetrics?: Record<string, MetricValue[]>;
  }
}

function pushMetric(name: string, value: MetricValue): void {
  if (typeof window === 'undefined') return;
  if (!window.__strandMetrics) window.__strandMetrics = {};
  if (!window.__strandMetrics[name]) window.__strandMetrics[name] = [];
  window.__strandMetrics[name]!.push(value);
}

export function recordMetric(name: string, value: MetricValue): void {
  pushMetric(name, value);
}

export function markPerfStart(name: string): void {
  if (typeof performance === 'undefined') return;
  performance.mark(`${name}:start`);
}

export function markPerfEnd(name: string): void {
  if (typeof performance === 'undefined') return;
  const start = `${name}:start`;
  const end = `${name}:end`;
  performance.mark(end);
  try {
    performance.measure(name, start, end);
    const entries = performance.getEntriesByName(name);
    const latest = entries[entries.length - 1];
    if (latest) recordMetric(name, Number(latest.duration.toFixed(3)));
  } catch {
    // no-op
  } finally {
    performance.clearMarks(start);
    performance.clearMarks(end);
    performance.clearMeasures(name);
  }
}

export function reportError(scope: string, error: unknown): void {
  console.error(`[${scope}]`, error);
  recordMetric(`${scope}:error`, true);
}
