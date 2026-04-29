// Run with: pnpm tsx server/middleware/__tests__/pii.test.ts
import { extractPII, restorePII } from "../deepseek.js";

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

// ─── Test 1: Full extraction and restoration ──────────────────────────────────
console.log("\nTest 1: Basic PII extraction and restoration");
{
  const input = {
    stufe_1_extraktion: {
      adresse: "Währinger Straße 45, 1090 Wien",
      makler: "Zakaryan & Partner",
      titel: "Elegante Altbauwohnung nahe der Währinger Straße",
      ausstattung: ["Parkett", "Blick auf Währinger Straße"],
    },
  };

  const { sanitized, piiMap } = extractPII(input);

  // Adresse should be replaced
  assert(
    sanitized.stufe_1_extraktion.adresse.startsWith("[PII_"),
    "adresse field replaced with placeholder"
  );

  // Makler should be replaced
  assert(
    sanitized.stufe_1_extraktion.makler.startsWith("[PII_"),
    "makler field replaced with placeholder"
  );

  // piiMap should contain both
  assert(piiMap.size >= 2, `piiMap has ${piiMap.size} entries (≥ 2)`);

  // Original address should be in piiMap
  const hasAddress = [...piiMap.values()].includes("Währinger Straße 45, 1090 Wien");
  assert(hasAddress, "piiMap contains original address");

  // Free text in titel should also be sanitized (Option B)
  assert(
    !sanitized.stufe_1_extraktion.titel.includes("Währinger Straße 45"),
    "address removed from free-text titel"
  );

  // Free text in ausstattung array should also be sanitized
  assert(
    !sanitized.stufe_1_extraktion.ausstattung[1].includes("Währinger Straße"),
    "street name removed from ausstattung array item"
  );

  // Partial placeholder in piiMap for street name
  const hasPartial = [...piiMap.keys()].some((k) => k.includes("_PARTIAL"));
  assert(hasPartial, "partial placeholder exists for street name");

  // Restoration (pass originals so warnings only fire when placeholder was expected)
  const originalTexts = ["Freehold apartment near [PII_1_PARTIAL]", "Broker: [PII_2]"];
  const restored = restorePII(originalTexts, piiMap, originalTexts);
  assert(
    restored[0].includes("Währinger Straße"),
    "street name restored from partial placeholder"
  );
  assert(
    restored[1].includes("Zakaryan & Partner"),
    "broker name restored"
  );
}

// ─── Test 2: PLZ only (should NOT be redacted) ────────────────────────────────
console.log("\nTest 2: PLZ-only value (should NOT be redacted)");
{
  const input = { stufe_1_extraktion: { plz: "1090" } };
  const { sanitized, piiMap } = extractPII(input);
  assert(sanitized.stufe_1_extraktion.plz === "1090", "pure postal code not replaced");
  assert(piiMap.size === 0, "piiMap empty for postal-code-only input");
}

// ─── Test 3: Empty object (should not crash) ──────────────────────────────────
console.log("\nTest 3: Empty object");
{
  const { sanitized, piiMap } = extractPII({});
  assert(typeof sanitized === "object", "returns object for empty input");
  assert(piiMap.size === 0, "piiMap empty for empty input");
}

// ─── Test 4: No PII fields (should not crash) ─────────────────────────────────
console.log("\nTest 4: Object without PII fields");
{
  const input = {
    meta: { konfidenz: 0.92 },
    stufe_1_extraktion: { flaeche: 85, zimmer: 3 },
  };
  const { sanitized, piiMap } = extractPII(input);
  assert((sanitized as any).meta.konfidenz === 0.92, "non-PII values unchanged");
  assert(piiMap.size === 0, "piiMap empty for non-PII input");
}

// ─── Test 5: restorePII fallback variants ─────────────────────────────────────
console.log("\nTest 5: restorePII fallback bracket variants");
{
  const piiMap = new Map([["[PII_1]", "Marxergasse 12"]]);
  const withAltBrackets = restorePII(["Located at (PII_1)."], piiMap);
  assert(withAltBrackets[0].includes("Marxergasse 12"), "fallback (PII_1) variant restored");

  const withNoBrackets = restorePII(["Located at PII_1."], piiMap);
  assert(withNoBrackets[0].includes("Marxergasse 12"), "fallback PII_1 (no brackets) restored");
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
