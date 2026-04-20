import dns from "node:dns";

type ValidationResult =
  | { ok: true; resolvedIP: string; hostname: string }
  | { ok: false; reason: string };

// Private IP ranges that must not be reached (SSRF blacklist)
const PRIVATE_RANGES = [
  // IPv4
  /^127\./,                          // 127.0.0.0/8 Loopback
  /^10\./,                           // 10.0.0.0/8 Private
  /^192\.168\./,                     // 192.168.0.0/16 Private
  /^172\.(1[6-9]|2\d|3[01])\./,     // 172.16.0.0/12 Private
  /^169\.254\./,                     // 169.254.0.0/16 Link-Local
  // IPv6
  /^::1$/,                           // IPv6 Loopback
  /^fc/i,                            // fc00::/7 IPv6 Private
  /^fd/i,                            // part of fc00::/7
  /^fe80/i,                          // fe80::/10 IPv6 Link-Local
];

function isPrivateIP(ip: string): boolean {
  return PRIVATE_RANGES.some((pattern) => pattern.test(ip));
}

export async function validateURL(rawUrl: string): Promise<ValidationResult> {
  // 1. Length check
  if (rawUrl.length > 2048) {
    return { ok: false, reason: "URL exceeds maximum length of 2048 characters." };
  }

  // 2. Parse & schema check
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "Invalid URL format." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: `URL scheme '${parsed.protocol}' is not allowed. Only http and https are permitted.` };
  }

  // 3. Credentials check
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "URLs with embedded credentials are not allowed." };
  }

  // 4. DNS resolution + private IP check
  let resolvedIP: string;
  try {
    const result = await dns.promises.lookup(parsed.hostname);
    resolvedIP = result.address;
  } catch {
    return { ok: false, reason: `Could not resolve hostname '${parsed.hostname}'.` };
  }

  if (isPrivateIP(resolvedIP)) {
    return { ok: false, reason: `Requests to private or internal IP addresses are not allowed (resolved: ${resolvedIP}).` };
  }

  return { ok: true, resolvedIP, hostname: parsed.hostname };
}
