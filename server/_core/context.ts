import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Session, SessionData } from "express-session";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  // Express-session attaches `session` to req. Expose it directly for routers.
  session: Session & Partial<SessionData>;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  return {
    req: opts.req,
    res: opts.res,
    session: opts.req.session,
  };
}
