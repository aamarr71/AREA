import axios from "axios";
import proj4 from "proj4";
import { logger } from "./logger.js";

// EPSG:31256 — MGI / Austria GK East (Wien WFS native CRS)
proj4.defs(
  "EPSG:31256",
  "+proj=tmerc +lat_0=0 +lon_0=16.33333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs"
);

const WFS_URL = "https://data.wien.gv.at/daten/geo";
const LAYER = "ogdwien:GENFLWIDMUNGOGD";

// Vienna bounding box in WGS84 (rough check before API call)
const WIEN_BOUNDS = { minLat: 48.0, maxLat: 48.4, minLng: 16.1, maxLng: 16.6 };
// BBOX buffer in EPSG:31256 meters
const BBOX_BUFFER_M = 150;

export interface WidmungResult {
  kategorie: string;
  bauklasse: string | null;
  kurzbezeichnung: string;
  plandokument: string | null;
  schutzzone: boolean;
  raw: object;
}

export interface WidmungsWiderspruch {
  beschreibung: string;
  severity: "hoch" | "mittel";
}

// Simple in-module cache: key → { result, expiresAt }
const TTL_7D = 7 * 24 * 60 * 60_000;
const widmungCache = new Map<string, { result: WidmungResult | null; expiresAt: number }>();

function cacheKey(lat: number, lng: number): string {
  // Round to ~11m precision (4 decimals)
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function isInWien(lat: number, lng: number): boolean {
  return (
    lat >= WIEN_BOUNDS.minLat &&
    lat <= WIEN_BOUNDS.maxLat &&
    lng >= WIEN_BOUNDS.minLng &&
    lng <= WIEN_BOUNDS.maxLng
  );
}

function parseWidmungsklasse(props: Record<string, any>): {
  kategorie: string;
  kurzbezeichnung: string;
  bauklasse: string | null;
} {
  // WIDMUNGSKLASSE_TXT is the human-readable category
  const kategorie = props.WIDMUNGSKLASSE_TXT ?? props.WIDMUNG_TXT ?? props.WIDMUNG ?? "Unbekannt";

  // WIDMUNGSKLASSE is the short code (W, GB, BB, Esp, Gr, ...)
  const kurzbezeichnung = props.WIDMUNGSKLASSE ?? props.WIDMUNG ?? "?";

  // Bauklasse is embedded in WIDMUNG_DETAIL or the WIDMUNG field itself
  // Typical pattern: "W3" = Wohngebiet Bauklasse III, "GB2" = GB Bauklasse II
  const detail: string = props.WIDMUNG_DETAIL ?? props.WIDMUNG ?? "";
  const bauklasseMatch = detail.match(/\b([IVX]{1,5}|[1-6])\b/);
  const bauklasse = bauklasseMatch ? bauklasseMatch[1] : null;

  return { kategorie, kurzbezeichnung, bauklasse };
}

export async function getWidmung(lat: number, lng: number): Promise<WidmungResult | null> {
  if (!isInWien(lat, lng)) {
    logger.info({ msg: "widmung_outside_wien", lat, lng });
    return null;
  }

  const key = cacheKey(lat, lng);
  const cached = widmungCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    logger.info({ msg: "widmung_cache_hit", lat, lng });
    return cached.result;
  }

  // Transform WGS84 → EPSG:31256
  const [x, y] = proj4("EPSG:4326", "EPSG:31256", [lng, lat]);
  const bbox = `${x - BBOX_BUFFER_M},${y - BBOX_BUFFER_M},${x + BBOX_BUFFER_M},${y + BBOX_BUFFER_M}`;

  try {
    const res = await axios.get(WFS_URL, {
      params: {
        service: "WFS",
        request: "GetFeature",
        version: "1.1.0",
        typeName: LAYER,
        BBOX: bbox,
        outputFormat: "application/json",
        maxFeatures: 1,
      },
      timeout: 5_000,
    });

    const features = res.data?.features;
    if (!Array.isArray(features) || features.length === 0) {
      widmungCache.set(key, { result: null, expiresAt: Date.now() + TTL_7D });
      logger.info({ msg: "widmung_no_feature", lat, lng });
      return null;
    }

    const props: Record<string, any> = features[0].properties ?? {};
    const { kategorie, kurzbezeichnung, bauklasse } = parseWidmungsklasse(props);

    const result: WidmungResult = {
      kategorie,
      bauklasse,
      kurzbezeichnung,
      // BEFRISTUNG_PD is the most likely plandokument reference found in DescribeFeatureType
      plandokument: props.BEFRISTUNG_PD ?? null,
      // Schutzzone is indicated by "Schutzzone" appearing in any widmung field
      schutzzone:
        String(props.WIDMUNG_DETAIL ?? "").includes("Schutzzone") ||
        String(props.WIDMUNG_TXT ?? "").includes("Schutzzone") ||
        String(props.STR ?? "").includes("Schutzzone"),
      raw: props,
    };

    widmungCache.set(key, { result, expiresAt: Date.now() + TTL_7D });
    logger.info({ msg: "widmung_ok", lat, lng, kurzbezeichnung });
    return result;
  } catch (err: any) {
    logger.warn({ msg: "widmung_error", lat, lng, error: err?.message });
    return null;
  }
}

// Simple keyword-based widerspruch check — false negatives preferred over false positives
export function checkWidmungsWiderspruch(
  exposéTyp: string,
  widmung: WidmungResult
): WidmungsWiderspruch | null {
  const kz = widmung.kurzbezeichnung.toUpperCase();
  const typ = exposéTyp.toLowerCase();

  // Pure Wohngebiet ("W") + Gewerbe/Büro → Widerspruch
  if (kz === "W" && (typ.includes("geschäft") || typ.includes("gewerbe") || typ.includes("büro"))) {
    return {
      beschreibung: `Exposé bewirbt gewerbliche Nutzung, Widmung ist jedoch "${widmung.kategorie}" (${widmung.kurzbezeichnung}). Gewerbliche Nutzung wäre genehmigungspflichtig.`,
      severity: "hoch",
    };
  }

  // Betriebsbaugebiet ("BB") + Wohnnutzung → Widerspruch
  if (kz === "BB" && (typ.includes("wohnung") || typ.includes("wohn") || typ.includes("haus"))) {
    return {
      beschreibung: `Exposé bewirbt Wohnnutzung, Widmung ist jedoch "${widmung.kategorie}" (${widmung.kurzbezeichnung}). Dauerhafte Wohnnutzung im Betriebsbaugebiet ist nicht zulässig.`,
      severity: "hoch",
    };
  }

  return null;
}
