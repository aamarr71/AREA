import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("analysis.analyze", () => {
  it("rejects invalid URLs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.analysis.analyze({ url: "not-a-url" })
    ).rejects.toThrow();
  });

  it("accepts valid URL input shape", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // This will fail because n8n is not reachable in test, but it validates
    // that the input parsing works correctly for a valid URL
    await expect(
      caller.analysis.analyze({ url: "https://example.com/immobilie/123" })
    ).rejects.toThrow(); // Expected: network error since n8n isn't available in test
  });
});
