import crypto from "node:crypto";
import { publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { validateURL } from "./middleware/ssrf";
import { logger } from "./middleware/logger";
import { fetchWithRetry } from "./middleware/fetchWithRetry";
import { recordAnalysis, getMetrics, getRecentErrors } from "./middleware/metrics";
import { getCached, setCache, clearCache } from "./middleware/cache";
import { z } from "zod";
import axios from "axios";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, service: "AREA" })),

  analysis: router({
    analyze: publicProcedure
      .input(z.object({
        url: z.string().trim().url().max(2048),
        force: z.boolean().optional().default(false),
      }))
      .mutation(async ({ input }) => {
        const startMs = Date.now();
        const urlObj = new URL(input.url);
        logger.info({ msg: "analysis_started", url: urlObj.hostname + urlObj.pathname });

        // Step 3: SSRF check
        const validation = await validateURL(input.url);
        logger.info({ msg: "ssrf_check", ok: validation.ok, ...(validation.ok ? { resolvedIP: validation.resolvedIP } : { reason: validation.reason }) });
        if (!validation.ok) {
          throw new Error(validation.reason);
        }

        // Step 4: Fetch page for hashing (graceful — if it fails, skip cache)
        let pageHash: string | null = null;
        try {
          const pageRes = await axios.get(input.url, { timeout: 15_000 });
          const bodyText = typeof pageRes.data === "string" ? pageRes.data : JSON.stringify(pageRes.data);
          pageHash = crypto.createHash("sha256").update(bodyText).digest("hex");
        } catch {
          logger.warn({ msg: "page_fetch_failed", url: input.url });
        }

        // Step 6: Cache check (skip if force=true or no hash)
        if (!input.force && pageHash) {
          const cached = getCached(input.url, pageHash);
          if (cached) {
            recordAnalysis({
              url: input.url,
              timestamp: Date.now(),
              durationMs: Date.now() - startMs,
              success: true,
              cacheHit: true,
            });
            return cached;
          }
        }

        try {
          // Step 7: n8n call via fetchWithRetry
          logger.info({ msg: "n8n_request", url: ENV.n8nWebhookUrl });
          const n8nStart = Date.now();
          let data = await fetchWithRetry(ENV.n8nWebhookUrl, { url: input.url });
          logger.info({ msg: "n8n_response", durationMs: Date.now() - n8nStart });

          // Step 8: Parse — the 6-format parser below is UNTOUCHED

          // n8n may wrap in array
          if (Array.isArray(data)) {
            data = data[0];
          }

          // Helper: safely parse JSON, fixing common LLM quirks like 6_500
          const safeParse = (str: string) => {
            let clean = str.trim();
            if (clean.startsWith("```")) {
              clean = clean.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
            }
            // Remove JS numeric separators (6_500 → 6500) — invalid in JSON
            clean = clean.replace(/(\d)_(\d)/g, "$1$2");
            return JSON.parse(clean);
          };

          // Shape 1: OpenAI Responses API (gpt-4.1) — output[].content[].text
          const responsesText = data?.output?.[0]?.content?.[0]?.text;
          if (typeof responsesText === "string") {
            logger.info({ msg: "parser_result", format: "shape_1_responses_api" });
            const result = safeParse(responsesText);
            if (pageHash) setCache(input.url, pageHash, result);
            recordAnalysis({ url: input.url, timestamp: Date.now(), durationMs: Date.now() - startMs, success: true, cacheHit: false, format: "shape_1" });
            logger.info({ msg: "analysis_complete", durationMs: Date.now() - startMs, confidence: result?.meta?.konfidenz });
            return result;
          }

          // Shape 2: OpenAI Chat Completions — message.content
          const chatText = data?.message?.content
            ?? data?.choices?.[0]?.message?.content;
          if (typeof chatText === "string") {
            logger.info({ msg: "parser_result", format: "shape_2_chat_completions" });
            const result = safeParse(chatText);
            if (pageHash) setCache(input.url, pageHash, result);
            recordAnalysis({ url: input.url, timestamp: Date.now(), durationMs: Date.now() - startMs, success: true, cacheHit: false, format: "shape_2" });
            logger.info({ msg: "analysis_complete", durationMs: Date.now() - startMs, confidence: result?.meta?.konfidenz });
            return result;
          }

          // Shape 3: n8n simplified — direct text field
          if (typeof data?.text === "string") {
            logger.info({ msg: "parser_result", format: "shape_3_n8n_text" });
            const result = safeParse(data.text);
            if (pageHash) setCache(input.url, pageHash, result);
            recordAnalysis({ url: input.url, timestamp: Date.now(), durationMs: Date.now() - startMs, success: true, cacheHit: false, format: "shape_3" });
            logger.info({ msg: "analysis_complete", durationMs: Date.now() - startMs, confidence: result?.meta?.konfidenz });
            return result;
          }

          // Shape 4: n8n langchain — output as string
          if (typeof data?.output === "string") {
            logger.info({ msg: "parser_result", format: "shape_4_langchain" });
            const result = safeParse(data.output);
            if (pageHash) setCache(input.url, pageHash, result);
            recordAnalysis({ url: input.url, timestamp: Date.now(), durationMs: Date.now() - startMs, success: true, cacheHit: false, format: "shape_4" });
            logger.info({ msg: "analysis_complete", durationMs: Date.now() - startMs, confidence: result?.meta?.konfidenz });
            return result;
          }

          // Shape 5: already parsed JSON
          if (data?.meta && data?.stufe_1_extraktion) {
            logger.info({ msg: "parser_result", format: "shape_5_parsed_json" });
            if (pageHash) setCache(input.url, pageHash, data);
            recordAnalysis({ url: input.url, timestamp: Date.now(), durationMs: Date.now() - startMs, success: true, cacheHit: false, format: "shape_5" });
            logger.info({ msg: "analysis_complete", durationMs: Date.now() - startMs, confidence: data?.meta?.konfidenz });
            return data;
          }

          // Shape 6: async webhook misconfiguration
          if (data?.message === "Workflow was started") {
            throw new Error(
              "n8n Webhook ist auf asynchron konfiguriert. Bitte Webhook-Node auf 'When Last Node Finishes' stellen."
            );
          }

          console.error("[AREA] Unbekanntes n8n Response-Format:", JSON.stringify(data).slice(0, 500));
          throw new Error("Unerwartetes Response-Format von n8n. Bitte Workflow prüfen.");
        } catch (error: any) {
          if (error?.message?.startsWith("n8n") || error?.message?.startsWith("Unerwartet")) {
            recordAnalysis({ url: input.url, timestamp: Date.now(), durationMs: Date.now() - startMs, success: false, cacheHit: false, error: error.message });
            throw error;
          }
          const message = error?.response?.data?.message
            || error?.message
            || "Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.";
          const errorDetail = error?.detail ? `${error.name}: ${error.detail}` : message;
          logger.error({ msg: "analysis_error", errorType: error?.name, message, detail: error?.detail });
          recordAnalysis({ url: input.url, timestamp: Date.now(), durationMs: Date.now() - startMs, success: false, cacheHit: false, error: errorDetail });
          throw new Error(message);
        }
      }),
  }),

  admin: router({
    stats: publicProcedure
      .input(z.object({ password: z.string() }))
      .query(({ input }) => {
        if (input.password !== ENV.adminPassword) {
          throw new Error("Unauthorized");
        }
        return getMetrics();
      }),

    errors: publicProcedure
      .input(z.object({ password: z.string(), limit: z.number().optional() }))
      .query(({ input }) => {
        if (input.password !== ENV.adminPassword) {
          throw new Error("Unauthorized");
        }
        return getRecentErrors(input.limit);
      }),

    clearCache: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        if (input.password !== ENV.adminPassword) {
          throw new Error("Unauthorized");
        }
        clearCache();
        return { ok: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
