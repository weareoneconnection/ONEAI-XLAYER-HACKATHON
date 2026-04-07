import crypto from "node:crypto";

export function hashText(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function safeString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

export function safeStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => String(item)).filter(Boolean);
}

export function fakeTxHash(seed: string) {
  return `0x${hashText(seed).slice(0, 64)}`;
}

export function buildExplorerTxUrl(baseUrl: string, txHash: string) {
  return `${baseUrl.replace(/\/$/, "")}/tx/${txHash}`;
}
