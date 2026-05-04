import { findRepoRoot } from "./repo-root.ts";
import { createContextStore } from "./store-factory.ts";
import { callContextTool } from "./tools.ts";
import { mcpTools } from "./tool-list.ts";
import { isToolName } from "./validation.ts";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

const repoRoot = findRepoRoot();
const store = createContextStore(repoRoot);

function makeResponse(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function makeError(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handle(request: JsonRpcRequest): Promise<unknown | null> {
  if (request.method === "notifications/initialized") return null;

  if (request.method === "initialize") {
    return makeResponse(request.id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "area-context-server", version: "0.1.0" },
    });
  }

  if (request.method === "ping") {
    return makeResponse(request.id, {});
  }

  if (request.method === "tools/list") {
    return makeResponse(request.id, { tools: mcpTools });
  }

  if (request.method === "tools/call") {
    const name = String(request.params?.name ?? "");
    if (!isToolName(name)) return makeError(request.id, -32602, `Unknown tool: ${name}`);
    try {
      const result = await callContextTool(name, request.params?.arguments ?? {}, { store, repoRoot });
      return makeResponse(request.id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      });
    } catch (error) {
      return makeError(
        request.id,
        -32603,
        error instanceof Error ? error.message : "Unknown AREA context tool error",
      );
    }
  }

  return makeError(request.id, -32601, `Unknown method: ${request.method}`);
}

function writeMessage(message: unknown): void {
  const json = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  void drainBuffer();
});

async function drainBuffer(): Promise<void> {
  while (buffer.length > 0) {
    const message = nextMessage();
    if (!message) return;
    const response = await handle(message);
    if (response) writeMessage(response);
  }
}

function nextMessage(): JsonRpcRequest | null {
  const headerEnd = buffer.indexOf("\r\n\r\n");
  if (headerEnd >= 0 && buffer.startsWith("Content-Length:")) {
    const header = buffer.slice(0, headerEnd);
    const match = /Content-Length:\s*(\d+)/i.exec(header);
    if (!match) throw new Error("Invalid MCP Content-Length header");
    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (buffer.length < bodyEnd) return null;
    const body = buffer.slice(bodyStart, bodyEnd);
    buffer = buffer.slice(bodyEnd);
    return JSON.parse(body) as JsonRpcRequest;
  }

  const newline = buffer.indexOf("\n");
  if (newline < 0) return null;
  const line = buffer.slice(0, newline).trim();
  buffer = buffer.slice(newline + 1);
  return line ? (JSON.parse(line) as JsonRpcRequest) : null;
}
