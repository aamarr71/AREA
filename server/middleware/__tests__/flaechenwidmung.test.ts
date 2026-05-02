// Run with: pnpm tsx server/middleware/__tests__/flaechenwidmung.test.ts
import axios from "axios";
import { getWidmung, checkWidmungsWiderspruch, type WidmungResult } from "../flaechenwidmung.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

const originalGet = axios.get.bind(axios);

function makeWfsResponse(props: Record<string, any>) {
  return {
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: props,
          geometry: { type: "Point", coordinates: [16.358, 48.21] },
        },
      ],
    },
  };
}

// ─── Test 1: Successful widmung query ────────────────────────────────────────
console.log("\nTest 1: Successful Widmungsabfrage — Wohngebiet");
{
  (axios as any).get = async () =>
    makeWfsResponse({
      WIDMUNGSKLASSE: "W",
      WIDMUNGSKLASSE_TXT: "Wohngebiet",
      WIDMUNG: "W3",
      WIDMUNG_TXT: "Wohngebiet",
      WIDMUNG_DETAIL: "Wohngebiet - Bauklasse III",
      BEFRISTUNG_PD: "PD 7658",
      BEZIRK: "8",
    });

  const result = await getWidmung(48.2099, 16.3581); // inside Wien bounds
  assert(result !== null, "returns non-null result");
  assert(result?.kategorie === "Wohngebiet", "kategorie correct");
  assert(result?.kurzbezeichnung === "W", "kurzbezeichnung correct");
  assert(result?.plandokument === "PD 7658", "plandokument set");
  assert(result?.schutzzone === false, "schutzzone false");
}

// ─── Test 2: Cache hit ───────────────────────────────────────────────────────
console.log("\nTest 2: Cache hit on second call");
{
  let callCount = 0;
  (axios as any).get = async () => {
    callCount++;
    return makeWfsResponse({ WIDMUNGSKLASSE: "GB", WIDMUNGSKLASSE_TXT: "Gemischtes Baugebiet" });
  };

  // Use coordinates not used in test 1 to avoid cache
  await getWidmung(48.2200, 16.3700);
  await getWidmung(48.2200, 16.3700);
  assert(callCount === 1, "axios.get called only once (cache hit on 2nd call)");
}

// ─── Test 3: Outside Wien → null ─────────────────────────────────────────────
console.log("\nTest 3: Punkt außerhalb Wien → null");
{
  let callCount = 0;
  (axios as any).get = async () => {
    callCount++;
    return makeWfsResponse({ WIDMUNGSKLASSE: "W" });
  };

  const result = await getWidmung(47.5, 13.0); // Salzburg
  assert(result === null, "returns null for coordinates outside Wien");
  assert(callCount === 0, "no API call for non-Wien coordinates");
}

// ─── Test 4: WFS timeout → null, no exception ────────────────────────────────
console.log("\nTest 4: WFS timeout → null, no exception thrown");
{
  (axios as any).get = async () => {
    throw Object.assign(new Error("timeout"), { code: "ECONNABORTED" });
  };

  let threw = false;
  let result: any = undefined;
  try {
    result = await getWidmung(48.2150, 16.3650);
  } catch {
    threw = true;
  }
  assert(!threw, "no exception on timeout");
  assert(result === null, "returns null on timeout");
}

// ─── Test 5: WFS returns empty features → null ───────────────────────────────
console.log("\nTest 5: WFS empty features → null");
{
  (axios as any).get = async () => ({ data: { features: [] } });

  const result = await getWidmung(48.2180, 16.3720);
  assert(result === null, "returns null for empty WFS response");
}

// ─── Test 6: Schutzzone detection ────────────────────────────────────────────
console.log("\nTest 6: Schutzzone-Erkennung");
{
  (axios as any).get = async () =>
    makeWfsResponse({
      WIDMUNGSKLASSE: "W",
      WIDMUNGSKLASSE_TXT: "Wohngebiet",
      WIDMUNG_DETAIL: "Wohngebiet - Bauklasse III - Schutzzone",
    });

  const result = await getWidmung(48.2250, 16.3800);
  assert(result?.schutzzone === true, "schutzzone detected from WIDMUNG_DETAIL");
}

// ─── Test 7: Widmungs-Widerspruch Logik ──────────────────────────────────────
console.log("\nTest 7: Widmungs-Widerspruch-Logik");
{
  const wohngebiet: WidmungResult = {
    kategorie: "Wohngebiet",
    kurzbezeichnung: "W",
    bauklasse: "III",
    plandokument: null,
    schutzzone: false,
    raw: {},
  };
  const betriebsbaugebiet: WidmungResult = {
    kategorie: "Betriebsbaugebiet",
    kurzbezeichnung: "BB",
    bauklasse: null,
    plandokument: null,
    schutzzone: false,
    raw: {},
  };
  const gemischt: WidmungResult = {
    kategorie: "Gemischtes Baugebiet",
    kurzbezeichnung: "GB",
    bauklasse: "II",
    plandokument: null,
    schutzzone: false,
    raw: {},
  };

  // Gewerbe in Wohngebiet → Widerspruch
  const w1 = checkWidmungsWiderspruch("Geschäftslokal", wohngebiet);
  assert(w1 !== null, "Geschäftslokal in W → Widerspruch");
  assert(w1?.severity === "hoch", "severity hoch");

  // Wohnung in Betriebsbaugebiet → Widerspruch
  const w2 = checkWidmungsWiderspruch("Wohnung", betriebsbaugebiet);
  assert(w2 !== null, "Wohnung in BB → Widerspruch");
  assert(w2?.severity === "hoch", "severity hoch");

  // Wohnung in Gemischtem Baugebiet → kein Widerspruch
  const w3 = checkWidmungsWiderspruch("Wohnung", gemischt);
  assert(w3 === null, "Wohnung in GB → kein Widerspruch");

  // Gewerbe in Gemischtem Baugebiet → kein Widerspruch
  const w4 = checkWidmungsWiderspruch("Geschäftslokal", gemischt);
  assert(w4 === null, "Geschäftslokal in GB → kein Widerspruch");
}

// Restore
(axios as any).get = originalGet;

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
