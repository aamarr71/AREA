import { publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { z } from "zod";
import axios from "axios";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, service: "AREA" })),

  analysis: router({
    analyze: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }) => {
        try {
          const response = await axios.get(ENV.n8nWebhookUrl, {
            params: { url: input.url },
            timeout: 180000, // 3 minutes – GPT-4.1 analysis can take time
          });

          let data = response.data;

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
            return safeParse(responsesText);
          }

          // Shape 2: OpenAI Chat Completions — message.content
          const chatText = data?.message?.content
            ?? data?.choices?.[0]?.message?.content;
          if (typeof chatText === "string") {
            return safeParse(chatText);
          }

          // Shape 3: n8n simplified — direct text field
          if (typeof data?.text === "string") {
            return safeParse(data.text);
          }

          // Shape 4: n8n langchain — output as string
          if (typeof data?.output === "string") {
            return safeParse(data.output);
          }

          // Shape 5: already parsed JSON
          if (data?.meta && data?.stufe_1_extraktion) {
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
            throw error;
          }
          const message = error?.response?.data?.message
            || error?.message
            || "Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.";
          throw new Error(message);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
