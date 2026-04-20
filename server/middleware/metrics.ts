import { logger } from "./logger";

interface AnalysisRecord {
  url: string;
  timestamp: number;
  durationMs: number;
  success: boolean;
  error?: string;
  cacheHit: boolean;
  format?: string; // Which of the 6 shapes was detected
}

interface MetricsSnapshot {
  totalAnalyses: number;
  successful: number;
  failed: number;
  cacheHits: number;
  avgDurationMs: number;
  estimatedCostUsd: number; // ~$0.05 per successful non-cached analysis
  recentErrors: Array<{ url: string; timestamp: number; error: string }>;
  analysesToday: number;
  analysesThisWeek: number;
  analysesThisMonth: number;
}

const MAX_RECORDS = 1000;
const records: AnalysisRecord[] = [];

export function recordAnalysis(record: AnalysisRecord): void {
  // Log to Railway logs for persistence across restarts
  logger.info({ msg: "analysis_recorded", ...record });

  records.push(record);
  // Keep max 1000 records — drop oldest when full
  if (records.length > MAX_RECORDS) {
    records.splice(0, records.length - MAX_RECORDS);
  }
}

export function getMetrics(): MetricsSnapshot {
  const now = Date.now();
  const ONE_DAY = 86_400_000;
  const ONE_WEEK = 7 * ONE_DAY;
  const ONE_MONTH = 30 * ONE_DAY;

  const successful = records.filter((r) => r.success);
  const failed = records.filter((r) => !r.success);
  const cacheHits = records.filter((r) => r.cacheHit);
  const nonCachedSuccessful = successful.filter((r) => !r.cacheHit);

  const totalDuration = successful.reduce((sum, r) => sum + r.durationMs, 0);
  const avgDurationMs = successful.length > 0 ? Math.round(totalDuration / successful.length) : 0;

  const recentErrors = failed
    .slice(-20)
    .map((r) => ({ url: r.url, timestamp: r.timestamp, error: r.error ?? "unknown" }))
    .reverse();

  return {
    totalAnalyses: records.length,
    successful: successful.length,
    failed: failed.length,
    cacheHits: cacheHits.length,
    avgDurationMs,
    estimatedCostUsd: Math.round(nonCachedSuccessful.length * 0.05 * 100) / 100,
    recentErrors,
    analysesToday: records.filter((r) => now - r.timestamp < ONE_DAY).length,
    analysesThisWeek: records.filter((r) => now - r.timestamp < ONE_WEEK).length,
    analysesThisMonth: records.filter((r) => now - r.timestamp < ONE_MONTH).length,
  };
}

export function getRecentErrors(limit = 20): Array<{ url: string; timestamp: number; error: string }> {
  return records
    .filter((r) => !r.success)
    .slice(-limit)
    .map((r) => ({ url: r.url, timestamp: r.timestamp, error: r.error ?? "unknown" }))
    .reverse();
}
