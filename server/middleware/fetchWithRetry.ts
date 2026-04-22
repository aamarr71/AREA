import axios from "axios";
import { logger } from "./logger";

export class AnalysisTimeoutError extends Error {
  detail: string;
  constructor(detail = "ETIMEDOUT after 2 attempts") {
    super("Analyse vorübergehend nicht verfügbar. Bitte in 2 Minuten erneut versuchen.");
    this.name = "AnalysisTimeoutError";
    this.detail = detail;
  }
}

export class AnalysisWebhookError extends Error {
  detail: string;
  constructor(detail = "unknown") {
    super("Analyse-Service nicht erreichbar.");
    this.name = "AnalysisWebhookError";
    this.detail = detail;
  }
}

export class AnalysisParseError extends Error {
  constructor() {
    super("Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen.");
    this.name = "AnalysisParseError";
  }
}

function isTimeout(error: any): boolean {
  return error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT";
}

function isServerError(error: any): boolean {
  const status = error?.response?.status;
  return typeof status === "number" && status >= 500;
}

function isNetworkError(error: any): boolean {
  return !error?.response && !isTimeout(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  webhookUrl: string,
  params: Record<string, string>
): Promise<any> {
  let lastError: any;
  let failureReason: "timeout" | "server_error" | "network_error" | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await axios.get(webhookUrl, { params, timeout: 45_000 });
      return response.data;
    } catch (error: any) {
      lastError = error;

      // 4xx errors: no retry — client-side mistake, retrying won't help
      const status = error?.response?.status;
      if (typeof status === "number" && status >= 400 && status < 500) {
        throw error;
      }

      if (isTimeout(error)) {
        failureReason = "timeout";
      } else if (isServerError(error)) {
        failureReason = "server_error";
      } else if (isNetworkError(error)) {
        failureReason = "network_error";
      } else {
        throw error;
      }

      if (attempt === 1) {
        logger.warn({ msg: "n8n_retry", attempt: 2, reason: failureReason });
        await sleep(3_000);
      }
    }
  }

  // Both attempts failed — throw typed error with technical detail
  if (failureReason === "timeout") {
    const code = lastError?.code ?? "ETIMEDOUT";
    throw new AnalysisTimeoutError(`${code} after 2 attempts (45s timeout)`);
  }
  const status = lastError?.response?.status;
  const code = lastError?.code;
  const detail = status ? `HTTP ${status}` : code ? `${code}` : "network error";
  throw new AnalysisWebhookError(detail);
}
