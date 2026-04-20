import pino from "pino";
import { ENV } from "../_core/env";

export const logger = pino(
  { name: "area" },
  ENV.isProduction
    ? undefined
    : pino.transport({
        target: "pino-pretty",
        options: { colorize: true },
      })
);

export function generateRequestId(): string {
  return crypto.randomUUID();
}
