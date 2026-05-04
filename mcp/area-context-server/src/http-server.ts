import http from "node:http";
import { findRepoRoot } from "./repo-root.ts";
import { createContextStore } from "./store-factory.ts";
import { callContextTool } from "./tools.ts";
import { mcpTools } from "./tool-list.ts";
import { isToolName } from "./validation.ts";

type JsonRpcRequest = {
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const repoRoot = findRepoRoot();
const store = createContextStore(repoRoot);
const port = Number(process.env.AREA_CONTEXT_HTTP_PORT ?? 3333);

function sendJson(response: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

async function readJson(request: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

async function handleRpc(request: JsonRpcRequest): Promise<unknown> {
  if (request.method === "tools/list") {
    return { jsonrpc: "2.0", id: request.id, result: { tools: mcpTools } };
  }
  if (request.method === "tools/call") {
    const name = String(request.params?.name ?? "");
    if (!isToolName(name)) {
      return { jsonrpc: "2.0", id: request.id, error: { code: -32602, message: `Unknown tool: ${name}` } };
    }
    const result = await callContextTool(name, request.params?.arguments ?? {}, { store, repoRoot });
    return { jsonrpc: "2.0", id: request.id, result };
  }
  return {
    jsonrpc: "2.0",
    id: request.id,
    error: { code: -32601, message: `Unknown method: ${request.method ?? ""}` },
  };
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, await callContextTool("context.healthcheck", {}, { store, repoRoot }));
      return;
    }
    if (request.method === "GET" && request.url === "/tools") {
      sendJson(response, 200, { tools: mcpTools });
      return;
    }
    if (request.method === "POST" && request.url === "/mcp") {
      sendJson(response, 200, await handleRpc((await readJson(request)) as JsonRpcRequest));
      return;
    }
    sendJson(response, 404, { error: "not_found" });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unknown AREA context HTTP error",
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.error(`AREA context HTTP server listening on http://127.0.0.1:${port}`);
});

process.on("SIGINT", () => {
  server.close(() => {
    void store.close?.().finally(() => process.exit(0));
  });
});
