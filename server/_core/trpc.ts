import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Procedure that requires a logged-in user.
 * Adds `userId` and `userRole` to ctx.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Nicht eingeloggt" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.userId,
      userRole: ctx.session.userRole ?? "user",
    },
  });
});

/**
 * Procedure that requires the logged-in user to have role "admin".
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.userId || ctx.session.userRole !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nur für Admins" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.userId,
      userRole: "admin" as const,
    },
  });
});
