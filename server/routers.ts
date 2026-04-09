import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import axios from "axios";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://aamarr71.app.n8n.cloud/webhook/analyst";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  analysis: router({
    analyze: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }) => {
        try {
          const response = await axios.get(N8N_WEBHOOK_URL, {
            params: { url: input.url },
            timeout: 120000, // 2 minutes – GPT-4.1 analysis can take time
          });

          let parsed = response.data;

          // Handle n8n response format (might be array, might have nested output)
          if (Array.isArray(parsed)) {
            parsed = parsed[0];
          }
          // If the response has an output field with message content
          if (parsed?.output?.[0]?.content?.[0]?.text) {
            parsed = JSON.parse(parsed.output[0].content[0].text);
          }
          // If the response has a message field
          if (parsed?.message?.content) {
            parsed = JSON.parse(parsed.message.content);
          }

          return parsed;
        } catch (error: any) {
          const message = error?.response?.data?.message
            || error?.message
            || "Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.";
          throw new Error(message);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
