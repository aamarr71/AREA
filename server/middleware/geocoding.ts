import crypto from "node:crypto";
import axios from "axios";
import { logger } from "./logger.js";

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  confidence: "high" | "medium" | "low";
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "AREA/1.0 (amuj71@icloud.com)";

// Simple in-module cache: key → { result, expiresAt }
const TTL_24H = 24 * 60 * 60_000;
const geocodeCache = new Map<string, { result: GeocodingResult | null; expiresAt: number }>();

// Rate-limit: Nominatim allows max 1 req/s
let lastCallMs = 0;
async function nominatimRateLimit(): Promise<void> {
  const wait = 1100 - (Date.now() - lastCallMs);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallMs = Date.now();
}

function cacheKey(address: string): string {
  return crypto.createHash("sha256").update(address.toLowerCase().trim()).digest("hex");
}

function assessConfidence(result: any): GeocodingResult["confidence"] {
  const rank: number = result.place_rank ?? 999;
  const type: string = result.type ?? "";
  if (rank <= 30 && (type === "house" || type === "building")) return "high";
  if (type === "road" || type === "residential") return "medium";
  return "low";
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const key = cacheKey(address);
  const cached = geocodeCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    logger.info({ msg: "geocode_cache_hit", address });
    return cached.result;
  }

  await nominatimRateLimit();

  try {
    const res = await axios.get(NOMINATIM_URL, {
      params: {
        q: address,
        format: "json",
        countrycodes: "at",
        limit: 1,
        addressdetails: 1,
      },
      headers: { "User-Agent": USER_AGENT },
      timeout: 8_000,
    });

    const hits: any[] = res.data;
    if (!Array.isArray(hits) || hits.length === 0) {
      geocodeCache.set(key, { result: null, expiresAt: Date.now() + TTL_24H });
      logger.info({ msg: "geocode_no_result", address });
      return null;
    }

    const hit = hits[0];
    const result: GeocodingResult = {
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
      displayName: hit.display_name ?? address,
      confidence: assessConfidence(hit),
    };

    geocodeCache.set(key, { result, expiresAt: Date.now() + TTL_24H });
    logger.info({ msg: "geocode_ok", address, confidence: result.confidence });
    return result;
  } catch (err: any) {
    logger.warn({ msg: "geocode_error", address, error: err?.message });
    return null;
  }
}
