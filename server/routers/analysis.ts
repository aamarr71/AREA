import crypto from "node:crypto";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import axios from "axios";
import { router, protectedProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";
import { validateURL } from "../middleware/ssrf";
import { logger } from "../middleware/logger";
import { fetchWithRetry } from "../middleware/fetchWithRetry";
import { recordAnalysis } from "../middleware/metrics";
import { getCached, setCache } from "../middleware/cache";
import { translateAnalysis } from "../middleware/deepseek";
import { geocodeAddress } from "../middleware/geocoding";
import { getWidmung, checkWidmungsWiderspruch } from "../middleware/flaechenwidmung";
import { db } from "../db/connection";
import { analyses } from "../db/schema";

export const analysisRouter = router({
  analyze: protectedProcedure
    .input(z.object({
      url: z.string().trim().url().max(2048),
      force: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const startMs = Date.now();
      const userId = ctx.userId;
      const urlObj = new URL(input.url);
      logger.info({ msg: "analysis_started", userId, url: urlObj.hostname + urlObj.pathname });

      // SSRF check
      const validation = await validateURL(input.url);
      logger.info({
        msg: "ssrf_check",
        ok: validation.ok,
        ...(validation.ok ? { resolvedIP: validation.resolvedIP } : { reason: validation.reason }),
      });
      if (!validation.ok) {
        throw new Error(validation.reason);
      }

      // Fetch page for hashing (graceful — if it fails, skip cache)
      let pageHash: string | null = null;
      try {
        const pageRes = await axios.get(input.url, { timeout: 15_000 });
        const bodyText = typeof pageRes.data === "string"
          ? pageRes.data
          : JSON.stringify(pageRes.data);
        pageHash = crypto.createHash("sha256").update(bodyText).digest("hex");
      } catch {
        logger.warn({ msg: "page_fetch_failed", url: input.url });
      }

      // Cache check (skip if force=true or no hash)
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
          // Persist cache-hit to history so users see all attempts
          const cacheRows = await db.insert(analyses).values({
            userId,
            url: input.url,
            contentHash: pageHash,
            result: JSON.stringify(cached),
            status: "success",
            durationMs: Date.now() - startMs,
          }).returning({ id: analyses.id }).catch(() => [] as { id: number }[]);
          return { _areaId: cacheRows[0]?.id ?? undefined, ...cached };
        }
      }

      try {
        logger.info({ msg: "n8n_request", url: ENV.n8nWebhookUrl });
        const n8nStart = Date.now();
        let data = await fetchWithRetry(ENV.n8nWebhookUrl, { url: input.url });
        logger.info({ msg: "n8n_response", durationMs: Date.now() - n8nStart });

        // ============================================================
        // 6-FORMAT PARSER — DO NOT TOUCH (battle-tested, see CLAUDE.md)
        // ============================================================

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

        // Enrich result with Standortdaten (geocoding + Flächenwidmung) — non-blocking
        const enrichWithStandortdaten = async (result: any): Promise<any> => {
          try {
            const adresse = result?.stufe_1_extraktion?.adresse;
            if (!adresse) return result;

            const { strasse, plz, bezirk } = adresse;
            const queryParts = [strasse, plz ? `${plz} Wien` : bezirk ? `${bezirk}, Wien` : "Wien", "Austria"].filter(Boolean);
            const queryStr = queryParts.join(", ");

            const geo = await geocodeAddress(queryStr);
            if (!geo) return result;

            const widmung = await getWidmung(geo.lat, geo.lng);
            const typ: string = result?.stufe_1_extraktion?.typ ?? "";
            const widerspruch = widmung ? checkWidmungsWiderspruch(typ, widmung) : null;

            return {
              ...result,
              standortdaten: {
                geocoding: { lat: geo.lat, lng: geo.lng, displayName: geo.displayName, confidence: geo.confidence },
                flaechenwidmung: widmung
                  ? {
                      kategorie: widmung.kategorie,
                      bauklasse: widmung.bauklasse,
                      kurzbezeichnung: widmung.kurzbezeichnung,
                      schutzzone: widmung.schutzzone,
                      plandokument: widmung.plandokument,
                    }
                  : null,
                widerspruch,
              },
            };
          } catch (err: any) {
            logger.warn({ msg: "standortdaten_error", error: err?.message });
            return result;
          }
        };

        const persistSuccess = async (result: any, format: string): Promise<number | null> => {
          if (pageHash) setCache(input.url, pageHash, result);
          recordAnalysis({
            url: input.url,
            timestamp: Date.now(),
            durationMs: Date.now() - startMs,
            success: true,
            cacheHit: false,
            format,
          });
          const rows = await db.insert(analyses).values({
            userId,
            url: input.url,
            contentHash: pageHash,
            result: JSON.stringify(result),
            status: "success",
            durationMs: Date.now() - startMs,
          }).returning({ id: analyses.id }).catch((err) => {
            logger.warn({ msg: "history_persist_failed", err: err?.message });
            return [] as { id: number }[];
          });
          logger.info({
            msg: "analysis_complete",
            durationMs: Date.now() - startMs,
            confidence: result?.meta?.konfidenz,
          });
          return rows[0]?.id ?? null;
        };

        // Shape 1: OpenAI Responses API (gpt-4.1) — output[].content[].text
        const responsesText = data?.output?.[0]?.content?.[0]?.text;
        if (typeof responsesText === "string") {
          logger.info({ msg: "parser_result", format: "shape_1_responses_api" });
          const result = await enrichWithStandortdaten(safeParse(responsesText));
          const id = await persistSuccess(result, "shape_1");
          return { _areaId: id ?? undefined, ...result };
        }

        // Shape 2: OpenAI Chat Completions — message.content
        const chatText = data?.message?.content
          ?? data?.choices?.[0]?.message?.content;
        if (typeof chatText === "string") {
          logger.info({ msg: "parser_result", format: "shape_2_chat_completions" });
          const result = await enrichWithStandortdaten(safeParse(chatText));
          const id = await persistSuccess(result, "shape_2");
          return { _areaId: id ?? undefined, ...result };
        }

        // Shape 3: n8n simplified — direct text field
        if (typeof data?.text === "string") {
          logger.info({ msg: "parser_result", format: "shape_3_n8n_text" });
          const result = await enrichWithStandortdaten(safeParse(data.text));
          const id = await persistSuccess(result, "shape_3");
          return { _areaId: id ?? undefined, ...result };
        }

        // Shape 4: n8n langchain — output as string
        if (typeof data?.output === "string") {
          logger.info({ msg: "parser_result", format: "shape_4_langchain" });
          const result = await enrichWithStandortdaten(safeParse(data.output));
          const id = await persistSuccess(result, "shape_4");
          return { _areaId: id ?? undefined, ...result };
        }

        // Shape 5: already parsed JSON
        if (data?.meta && data?.stufe_1_extraktion) {
          logger.info({ msg: "parser_result", format: "shape_5_parsed_json" });
          const result = await enrichWithStandortdaten(data);
          const id = await persistSuccess(result, "shape_5");
          return { _areaId: id ?? undefined, ...result };
        }

        // Shape 6: async webhook misconfiguration
        if (data?.message === "Workflow was started") {
          throw new Error(
            "n8n Webhook ist auf asynchron konfiguriert. Bitte Webhook-Node auf 'When Last Node Finishes' stellen."
          );
        }

        console.error("[AREA] Unbekanntes n8n Response-Format:", JSON.stringify(data).slice(0, 500));
        throw new Error("Unerwartetes Response-Format von n8n. Bitte Workflow prüfen.");
        // ============================================================
        // END OF UNTOUCHABLE PARSER BLOCK
        // ============================================================
      } catch (error: any) {
        const isParseLayer = error?.message?.startsWith("n8n")
          || error?.message?.startsWith("Unerwartet");
        const message = error?.response?.data?.message
          || error?.message
          || "Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.";
        const errorDetail = error?.detail ? `${error.name}: ${error.detail}` : message;
        const status: "error" | "timeout" = error?.name === "AnalysisTimeoutError" ? "timeout" : "error";

        logger.error({
          msg: "analysis_error",
          errorType: error?.name,
          message,
          detail: error?.detail,
        });
        recordAnalysis({
          url: input.url,
          timestamp: Date.now(),
          durationMs: Date.now() - startMs,
          success: false,
          cacheHit: false,
          error: errorDetail,
        });
        await db.insert(analyses).values({
          userId,
          url: input.url,
          contentHash: pageHash,
          status,
          errorMessage: errorDetail.slice(0, 1000),
          durationMs: Date.now() - startMs,
        }).catch((err) => logger.warn({ msg: "history_persist_failed", err: err?.message }));

        // Re-throw the user-facing message; for parse-layer errors keep original
        if (isParseLayer) throw error;
        throw new Error(message);
      }
    }),

  /** Last 50 analyses of the logged-in user, newest first. */
  history: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.query.analyses.findMany({
      where: eq(analyses.userId, ctx.userId),
      orderBy: [desc(analyses.createdAt)],
      limit: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      status: r.status,
      errorMessage: r.errorMessage,
      durationMs: r.durationMs,
      createdAt: r.createdAt,
    }));
  }),

  /** Load a single analysis result (only the user's own). */
  byId: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const row = await db.query.analyses.findFirst({
        where: eq(analyses.id, input.id),
      });
      if (!row || row.userId !== ctx.userId) {
        throw new Error("Analyse nicht gefunden.");
      }
      return {
        id: row.id,
        url: row.url,
        status: row.status,
        result: row.result ? JSON.parse(row.result) : null,
        errorMessage: row.errorMessage,
        durationMs: row.durationMs,
        createdAt: row.createdAt,
      };
    }),

  /** Translate an analysis result to English via DeepSeek.
   *  Accepts either a DB-backed analysisId (own analyses only) or raw inlineData (e.g. Demo). */
  translate: protectedProcedure
    .input(z.object({
      analysisId: z.number().int().positive().optional(),
      inlineData: z.any().optional(),
      targetLang: z.literal("en"),
    }))
    .mutation(async ({ ctx, input }) => {
      let data: any;

      if (input.analysisId) {
        const row = await db.query.analyses.findFirst({
          where: eq(analyses.id, input.analysisId),
        });
        if (!row || row.userId !== ctx.userId) {
          throw new Error("Analyse nicht gefunden.");
        }
        if (!row.result) {
          throw new Error("Kein Analyse-Ergebnis vorhanden.");
        }
        data = JSON.parse(row.result);
      } else if (input.inlineData) {
        data = input.inlineData;
      } else {
        throw new Error("Entweder analysisId oder inlineData erforderlich.");
      }

      logger.info({ msg: "translate_started", analysisId: input.analysisId ?? "inline" });

      try {
        const translated = await translateAnalysis(data);
        logger.info({ msg: "translate_complete", analysisId: input.analysisId ?? "inline" });
        return translated;
      } catch (err: any) {
        logger.error({ msg: "translate_failed", error: err?.message });
        throw new Error("Übersetzung fehlgeschlagen. Bitte versuchen Sie es erneut.");
      }
    }),
});
