// Run with: pnpm tsx server/middleware/__tests__/geocoding.test.ts
import axios from "axios";
import { geocodeAddress } from "../geocoding.js";

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

// Patch axios.get for all tests
const originalGet = axios.get.bind(axios);

// ─── Test 1: Successful geocoding ────────────────────────────────────────────
console.log("\nTest 1: Successful geocoding — Wiener Adresse");
{
  (axios as any).get = async (_url: string, _opts: any) => ({
    data: [
      {
        lat: "48.2099",
        lon: "16.3581",
        display_name: "Josefstädter Straße 17, 1080 Wien, Austria",
        place_rank: 30,
        type: "house",
      },
    ],
  });

  const result = await geocodeAddress("Josefstädter Straße 17, 1080 Wien, Austria");
  assert(result !== null, "returns non-null result");
  assert(Math.abs((result?.lat ?? 0) - 48.2099) < 0.001, "lat correct");
  assert(Math.abs((result?.lng ?? 0) - 16.3581) < 0.001, "lng correct");
  assert(result?.confidence === "high", "confidence is high for house type");
  assert(result?.displayName.includes("Josefstädter"), "displayName set");
}

// ─── Test 2: Cache hit (second call, same address) ───────────────────────────
console.log("\nTest 2: Cache hit on second call");
{
  let callCount = 0;
  (axios as any).get = async (_url: string, _opts: any) => {
    callCount++;
    return {
      data: [{ lat: "48.2099", lon: "16.3581", display_name: "test", place_rank: 30, type: "house" }],
    };
  };

  await geocodeAddress("Unique Cache Test Address 12345, 1010 Wien");
  await geocodeAddress("Unique Cache Test Address 12345, 1010 Wien");
  // Second call should not hit axios (cache hit)
  assert(callCount === 1, "axios.get called only once (cache hit on 2nd call)");
}

// ─── Test 3: Address not found → null ────────────────────────────────────────
console.log("\nTest 3: Address not found → null");
{
  (axios as any).get = async () => ({ data: [] });

  const result = await geocodeAddress("Nichtexistente Straße 9999, 9999 Nirgendwo");
  assert(result === null, "returns null for empty Nominatim response");
}

// ─── Test 4: Nominatim timeout → null, no exception ──────────────────────────
console.log("\nTest 4: Nominatim timeout → null, no exception thrown");
{
  (axios as any).get = async () => {
    throw Object.assign(new Error("timeout"), { code: "ECONNABORTED" });
  };

  let threw = false;
  let result: any = undefined;
  try {
    result = await geocodeAddress("Timeout Test Straße 1, 1010 Wien");
  } catch {
    threw = true;
  }
  assert(!threw, "no exception thrown on timeout");
  assert(result === null, "returns null on timeout");
}

// ─── Test 5: Confidence levels ───────────────────────────────────────────────
console.log("\nTest 5: Confidence assessment");
{
  (axios as any).get = async (_url: string, opts: any) => {
    const q: string = opts?.params?.q ?? "";
    if (q.includes("road")) {
      return { data: [{ lat: "48.2", lon: "16.3", display_name: "road test", place_rank: 26, type: "road" }] };
    }
    return { data: [{ lat: "48.2", lon: "16.3", display_name: "low test", place_rank: 18, type: "suburb" }] };
  };

  const roadResult = await geocodeAddress("road confidence test unique 111");
  assert(roadResult?.confidence === "medium", "road type → medium confidence");

  const lowResult = await geocodeAddress("low confidence test unique 222");
  assert(lowResult?.confidence === "low", "suburb type → low confidence");
}

// Restore
(axios as any).get = originalGet;

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
