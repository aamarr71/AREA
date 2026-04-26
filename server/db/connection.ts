import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ENV } from "../_core/env";
import * as schema from "./schema";

// Railway Postgres has limited connections; cap our pool conservatively.
const client = postgres(ENV.databaseUrl, {
  max: 5,
});

export const db = drizzle(client, { schema });
export { client };
