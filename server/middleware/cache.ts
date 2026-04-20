import { logger } from "./logger";

interface CacheEntry {
  hash: string;       // SHA-256 of page body text
  data: any;          // Parsed analysis result
  timestamp: number;  // When cached (ms)
}

const TTL_MS = 60 * 60_000; // 60 minutes
const MAX_ENTRIES = 200;
const CLEANUP_INTERVAL_MS = 10 * 60_000; // 10 minutes

const cache = new Map<string, CacheEntry>();
let hits = 0;
let misses = 0;

function normalizeUrl(url: string): string {
  return url.toLowerCase().replace(/\/+$/, "");
}

function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > TTL_MS;
}

// Lazy cleanup of expired entries every 10 minutes
setInterval(() => {
  let removed = 0;
  for (const [key, entry] of Array.from(cache.entries())) {
    if (isExpired(entry)) {
      cache.delete(key);
      removed++;
    }
  }
  if (removed > 0) {
    logger.info({ msg: "cache_cleanup", removed, remaining: cache.size });
  }
}, CLEANUP_INTERVAL_MS);

export function getCached(url: string, currentHash: string): any | null {
  const key = normalizeUrl(url);
  const entry = cache.get(key);

  if (!entry) {
    misses++;
    logger.info({ msg: "cache_miss", url: key });
    return null;
  }

  if (isExpired(entry)) {
    cache.delete(key);
    misses++;
    logger.info({ msg: "cache_expired", url: key });
    return null;
  }

  if (entry.hash !== currentHash) {
    misses++;
    logger.info({ msg: "cache_miss", url: key, reason: "hash_mismatch" });
    return null;
  }

  hits++;
  logger.info({ msg: "cache_hit", url: key });
  return entry.data;
}

export function setCache(url: string, hash: string, data: any): void {
  const key = normalizeUrl(url);

  // Evict oldest entry if at capacity
  if (cache.size >= MAX_ENTRIES && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(key, { hash, data, timestamp: Date.now() });
  logger.info({ msg: "cache_set", url: key, size: cache.size });
}

export function clearCache(): void {
  const size = cache.size;
  cache.clear();
  hits = 0;
  misses = 0;
  logger.info({ msg: "cache_cleared", cleared: size });
}

export function getCacheStats(): { size: number; hits: number; misses: number } {
  return { size: cache.size, hits, misses };
}
