import { ENV } from "../_core/env";
import { logger } from "./logger";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

const SYSTEM_PROMPT = `You are a professional German-to-English translator specializing in Austrian real estate terminology.

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
  const result = JSON.parse(JSON.stringify(data));
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

  if (toTranslate.length === 0) return result;

  const translations = await translateTexts(toTranslate);
  setters.forEach((setter, i) => setter(translations[i]));

  return result;
}
