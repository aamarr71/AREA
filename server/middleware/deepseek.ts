import { ENV } from "../_core/env";
import { logger } from "./logger";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

const SYSTEM_PROMPT = `CRITICAL RULE: Text in square brackets like [PII_1], [PII_2], [PII_1_PARTIAL] are privacy placeholders. You MUST:
- Keep them EXACTLY as they are (same spelling, same brackets)
- Do NOT translate, modify, remove, or explain them
- Do NOT add spaces inside the brackets
- Treat them as untouchable tokens

You are a professional German-to-English translator specializing in Austrian real estate terminology.

Rules:
- Translate each numbered line and return ONLY the translations in the same numbered format
- Preserve technical real estate terms correctly:
  - Betriebskosten → service charges
  - Eigentumswohnung → freehold apartment
  - Provision → commission (brokerage fee)
  - Grundbuch → land register
  - Stiege → staircase
  - Nutzwertgutachten → utility value assessment
  - Energieausweis → energy performance certificate
  - Neubau → new build
  - Altbau → period building
  - Richtwertmietzins → reference value rent
  - Betriebskostenpauschale → flat-rate service charge
- Keep proper nouns (names, addresses, company names) unchanged
- Keep numbers and units unchanged
- Maintain the same tone (professional, analytical)
- Do NOT add explanations, only translations`;

// ─── PII Detection ────────────────────────────────────────────────────────────

const PII_LOCATION_KEYS = [
  "adresse", "address", "straße", "strasse", "street",
  "plz", "postleitzahl", "zip",
  "bezirk", "district", "ort", "city", "standort", "location",
];

const PII_PERSON_KEYS = [
  "eigentümer", "eigentuemer", "owner",
  "verkäufer", "verkaeufer", "seller",
  "makler", "broker", "agent",
  "kontakt", "contact",
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPiiKey(key: string): "location" | "person" | "name" | null {
  const lower = key.toLowerCase();
  if (PII_LOCATION_KEYS.some((k) => lower.includes(k))) return "location";
  if (PII_PERSON_KEYS.some((k) => lower.includes(k))) return "person";
  if (lower.includes("name")) return "name";
  return null;
}

function looksLikePersonName(val: string): boolean {
  // 1-5 words, each starting with uppercase (including umlauts and & for company names)
  return /^[A-ZÄÖÜ][a-zA-ZäöüÄÖÜß\-&]+(\s[A-ZÄÖÜ&][a-zA-ZäöüÄÖÜß\-&]+){0,4}$/.test(val.trim())
    && val.length >= 3
    && val.length <= 60;
}

function isPostalCodeOnly(val: string): boolean {
  return /^\d{4,6}$/.test(val.trim());
}

function extractStreetName(address: string): string | null {
  // "Währinger Straße 45, 1090 Wien" → "Währinger Straße"
  // "Marxergasse 12" → "Marxergasse"
  const match = address.match(/^([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\s\-\.]+?)(?=\s+\d)/);
  return match ? match[1].trim() : null;
}

// ─── PII Extraction ───────────────────────────────────────────────────────────

interface PiiEntry {
  placeholder: string;
  value: string;
  partialPlaceholder?: string;
  partialValue?: string;
}

export function extractPII(data: Record<string, any>): {
  sanitized: Record<string, any>;
  piiMap: Map<string, string>;
} {
  const sanitized: Record<string, any> = JSON.parse(JSON.stringify(data));
  const piiMap = new Map<string, string>();
  const entries: PiiEntry[] = [];
  let counter = 0;

  function scanObj(obj: any): void {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && typeof item === "object") scanObj(item);
      }
      return;
    }
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val === null || val === undefined || val === "") continue;

      if (typeof val === "string") {
        const piiType = isPiiKey(key);
        let shouldRedact = false;

        if (piiType === "location") {
          // Skip pure postal codes — not PII on their own
          shouldRedact = !isPostalCodeOnly(val);
        } else if (piiType === "person") {
          shouldRedact = true;
        } else if (piiType === "name") {
          shouldRedact = looksLikePersonName(val);
        }

        if (shouldRedact) {
          counter++;
          const placeholder = `[PII_${counter}]`;
          piiMap.set(placeholder, val);
          obj[key] = placeholder;

          const entry: PiiEntry = { placeholder, value: val };

          if (piiType === "location") {
            const streetName = extractStreetName(val);
            if (streetName && streetName !== val && streetName.length > 3) {
              entry.partialPlaceholder = `[PII_${counter}_PARTIAL]`;
              entry.partialValue = streetName;
              piiMap.set(entry.partialPlaceholder, streetName);
            }
          }

          entries.push(entry);
        }
      } else if (typeof val === "object") {
        scanObj(val);
      }
    }
  }

  scanObj(sanitized);

  // Option B: Replace PII values found verbatim inside free-text string fields
  function replaceText(text: string): string {
    let result = text;
    for (const { value, placeholder, partialValue, partialPlaceholder } of entries) {
      if (value && !result.startsWith("[PII_")) {
        result = result.replace(new RegExp(escapeRegex(value), "g"), placeholder);
      }
      if (partialValue && partialPlaceholder) {
        result = result.replace(new RegExp(escapeRegex(partialValue), "g"), partialPlaceholder);
      }
    }
    return result;
  }

  function replaceInObj(obj: any): void {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === "string") {
          obj[i] = replaceText(obj[i]);
        } else {
          replaceInObj(obj[i]);
        }
      }
      return;
    }
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "string") {
        obj[key] = replaceText(obj[key]);
      } else if (typeof obj[key] === "object") {
        replaceInObj(obj[key]);
      }
    }
  }

  replaceInObj(sanitized);

  return { sanitized, piiMap };
}

// ─── PII Restoration ──────────────────────────────────────────────────────────

// originals: the pre-translation strings, used to know which placeholders were expected per entry
export function restorePII(
  translations: string[],
  piiMap: Map<string, string>,
  originals?: string[],
): string[] {
  if (piiMap.size === 0) return translations;

  return translations.map((text, idx) => {
    let result = text;
    const original = originals?.[idx] ?? "";

    for (const [placeholder, value] of Array.from(piiMap.entries())) {
      if (result.includes(placeholder)) {
        result = result.split(placeholder).join(value);
      } else {
        // Fallback: LLMs sometimes alter bracket syntax
        const variants = [
          placeholder.replace("[", "(").replace("]", ")"),  // (PII_1)
          placeholder.replace(/[\[\]]/g, ""),               // PII_1
          placeholder.replace("_", " "),                    // [PII 1]
        ];
        let restored = false;
        for (const variant of variants) {
          if (result.includes(variant)) {
            result = result.split(variant).join(value);
            restored = true;
            break;
          }
        }
        // Only warn when the placeholder was present in the original string (DeepSeek dropped it)
        if (!restored && original.includes(placeholder)) {
          logger.warn({
            msg: "pii_placeholder_missing",
            placeholder,
            hint: "DeepSeek may have altered or dropped this placeholder",
          });
        }
      }
    }
    return result;
  });
}

// ─── DeepSeek API ─────────────────────────────────────────────────────────────

export async function translateTexts(texts: string[]): Promise<string[]> {
  if (!ENV.deepseekApiKey) {
    throw new Error("DeepSeek API key not configured.");
  }
  if (texts.length === 0) return [];

  const numbered = texts.map((text, i) => `${i + 1}. ${text}`).join("\n");

  const res = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: numbered },
      ],
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`DeepSeek API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  const content: string = json.choices?.[0]?.message?.content ?? "";

  // Parse numbered list — each line starts with "N."
  const lines = content.split("\n").filter((l: string) => /^\d+\./.test(l.trim()));
  const parsed = lines.map((l: string) => l.replace(/^\d+\.\s*/, "").trim());

  if (parsed.length !== texts.length) {
    logger.warn({ msg: "deepseek_parse_mismatch", expected: texts.length, got: parsed.length });
    while (parsed.length < texts.length) parsed.push(texts[parsed.length]);
  }

  return parsed;
}

// Extracts all translatable dynamic fields from an analysis result,
// translates them in one API call, and returns a deep clone with translations applied.
export async function translateAnalysis(data: any): Promise<any> {
  const { sanitized: result, piiMap } = extractPII(data);
  const re = result.stufe_1_extraktion;
  const rq = result.stufe_2_qualitaetspruefung;
  const rs = result.stufe_3_verkaufsstrategie;

  const toTranslate: string[] = [];
  const setters: ((v: string) => void)[] = [];

  function add(val: string | undefined | null, setter: (v: string) => void) {
    if (val) {
      toTranslate.push(val);
      setters.push(setter);
    }
  }

  // Stufe 1
  add(re?.titel, (v) => { re.titel = v; });
  add(re?.typ, (v) => { re.typ = v; });
  (re?.ausstattung ?? []).forEach((a: string, i: number) => {
    add(a, (v) => { re.ausstattung[i] = v; });
  });

  // Stufe 2 — Widersprüche
  (rq?.widersprueche ?? []).forEach((w: any) => {
    add(w.feld, (v) => { w.feld = v; });
    add(w.problem, (v) => { w.problem = v; });
    add(w.empfehlung, (v) => { w.empfehlung = v; });
  });

  // Stufe 2 — Fehlende Angaben
  (rq?.fehlende_angaben ?? []).forEach((f: any) => {
    add(f.feld, (v) => { f.feld = v; });
    add(f.grund, (v) => { f.grund = v; });
    add(f.rechtsgrundlage, (v) => { f.rechtsgrundlage = v; });
    add(f.konsequenz, (v) => { f.konsequenz = v; });
    add(f.textbaustein, (v) => { f.textbaustein = v; });
  });

  // Stufe 2 — Schwächen
  (rq?.text_qualitaet?.schwaechen ?? []).forEach((s: string, i: number) => {
    add(s, (v) => { rq.text_qualitaet.schwaechen[i] = v; });
  });

  // Stufe 3 — Zielgruppe
  if (rs?.primaere_zielgruppe) {
    add(rs.primaere_zielgruppe.profil, (v) => { rs.primaere_zielgruppe.profil = v; });
    add(rs.primaere_zielgruppe.kaufmotiv, (v) => { rs.primaere_zielgruppe.kaufmotiv = v; });
    add(rs.primaere_zielgruppe.budget_einschaetzung, (v) => { rs.primaere_zielgruppe.budget_einschaetzung = v; });
  }

  // Stufe 3 — Verkaufsargumente
  (rs?.top_5_verkaufsargumente ?? []).forEach((a: any) => {
    add(a.argument, (v) => { a.argument = v; });
    add(a.emotionaler_trigger, (v) => { a.emotionaler_trigger = v; });
  });

  // Stufe 3 — Einwand-Handling
  (rs?.einwand_handling ?? []).forEach((e: any) => {
    add(e.einwand, (v) => { e.einwand = v; });
    add(e.antwort_fuer_makler, (v) => { e.antwort_fuer_makler = v; });
    add(e.tonalitaet, (v) => { e.tonalitaet = v; });
  });

  // Stufe 3 — Markteinschätzung
  if (rs?.markteinschaetzung) {
    add(rs.markteinschaetzung.preis_bewertung, (v) => { rs.markteinschaetzung.preis_bewertung = v; });
    add(rs.markteinschaetzung.empfehlung, (v) => { rs.markteinschaetzung.empfehlung = v; });
  }

  // Stufe 3 — Kurz-Exposé
  add(rs?.optimiertes_kurz_expose, (v) => { rs.optimiertes_kurz_expose = v; });

  // Standortdaten (Flächenwidmung + Widerspruch)
  const sd = result.standortdaten;
  if (sd?.flaechenwidmung?.kategorie) {
    add(sd.flaechenwidmung.kategorie, (v) => { sd.flaechenwidmung.kategorie = v; });
  }
  if (sd?.widerspruch?.beschreibung) {
    add(sd.widerspruch.beschreibung, (v) => { sd.widerspruch.beschreibung = v; });
  }

  if (toTranslate.length === 0) return result;

  const rawTranslations = await translateTexts(toTranslate);
  const translations = piiMap.size > 0 ? restorePII(rawTranslations, piiMap, toTranslate) : rawTranslations;
  setters.forEach((setter, i) => setter(translations[i]));

  return result;
}
