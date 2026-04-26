import { router, publicProcedure } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";
import { analysisRouter } from "./routers/analysis";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, service: "AREA" })),
  auth: authRouter,
  admin: adminRouter,
  analysis: analysisRouter,
});

export type AppRouter = typeof appRouter;
