import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { ENV } from "../_core/env";

const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({
    conString: ENV.databaseUrl,
    tableName: "sessions",
    createTableIfMissing: true,
    pruneSessionInterval: 60, // prune expired sessions every 60s
  }),
  secret: ENV.sessionSecret,
  name: "area.sid",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: ENV.isProduction, // HTTPS-only in prod
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
