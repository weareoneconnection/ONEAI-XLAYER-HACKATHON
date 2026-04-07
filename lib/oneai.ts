import { appConfig } from "@/lib/config";
import type { PlanResponse } from "@/lib/schemas";

type OneAIGenerateResponse = {
  success?: boolean;
  data?: any;
  error?: string;
  text?: string;
  output?: string;
  raw?: unknown;
};

function toStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, limit);
}

function extractRawText(json: OneAIGenerateResponse): string {
  if (typeof json?.text === "string" && json.text.trim()) {
    return json.text.trim();
  }

  if (typeof json?.output === "string" && json.output.trim()) {
    return json.output.trim();
  }

  if (typeof json?.data?.rawText === "string" && json.data.rawText.trim()) {
    return json.data.rawText.trim();
  }

  if (typeof json?.data?.text === "string" && json.data.text.trim()) {
    return json.data.text.trim();
  }

  if (typeof json?.data?.output === "string" && json.data.output.trim()) {
    return json.data.output.trim();
  }

  const fallbackParts: string[] = [];

  if (typeof json?.data?.summary === "string" && json.data.summary.trim()) {
    fallbackParts.push(`Summary: ${json.data.summary.trim()}`);
  }

  const tweets = toStringArray(json?.data?.tweets, 2);
  if (tweets.length > 0) {
    fallbackParts.push(`Tweets: ${tweets.join(" | ")}`);
  }

  const missions = toStringArray(json?.data?.missions, 4);
  if (missions.length > 0) {
    fallbackParts.push(`Missions: ${missions.join(" | ")}`);
  }

  const actions = toStringArray(json?.data?.actions, 4);
  if (actions.length > 0) {
    fallbackParts.push(`Actions: ${actions.join(" | ")}`);
  }

  return fallbackParts.join("\n");
}

function extractReasoning(data: any): string[] {
  const candidates = [
    toStringArray(data?.aiReasoning, 6),
    toStringArray(data?.reasoning, 6),
    toStringArray(data?.thoughts, 6),
    toStringArray(data?.whyTheseActions, 6),
  ];

  const direct = candidates.find((items) => items.length > 0);
  if (direct) return direct;

  const fallback: string[] = [];

  if (typeof data?.summary === "string" && data.summary.trim()) {
    fallback.push(`Narrative: ${data.summary.trim()}`);
  }

  if (Array.isArray(data?.tweets) && data.tweets.length > 0) {
    fallback.push("Generated launch tweet outputs for distribution.");
  }

  if (Array.isArray(data?.missions) && data.missions.length > 0) {
    fallback.push("Built mission structure for community coordination.");
  }

  if (Array.isArray(data?.actions) && data.actions.length > 0) {
    fallback.push("Prepared execution action graph for OneClaw runtime.");
  }

  if (fallback.length === 0) {
    fallback.push(
      "Converted the user goal into a hackathon-ready execution plan.",
      "Generated visible AI outputs for judges to review.",
      "Prepared mission and action structure for downstream execution.",
    );
  }

  return fallback.slice(0, 4);
}

function normalizePlan(
  data: any,
  rawText = "",
  rawJson?: unknown,
): PlanResponse {
  const summary = String(data?.summary || "Autonomous coordination on X Layer.");

  const tweets = toStringArray(data?.tweets, 2);
  const missions = toStringArray(data?.missions, 4);
  const actions = toStringArray(data?.actions, 4);
  const aiReasoning = extractReasoning(data);

  return {
    summary,
    tweets,
    missions,
    actions,
    proofLabel: String(data?.proofLabel || "Proof of Coordination"),
    aiReasoning,
    rawText:
      rawText ||
      [
        `Summary: ${summary}`,
        tweets.length ? `Tweets: ${tweets.join(" | ")}` : "",
        missions.length ? `Missions: ${missions.join(" | ")}` : "",
        actions.length ? `Actions: ${actions.join(" | ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    rawJson,
  };
}

export async function generateHackathonPlan(input: {
  prompt: string;
  walletAddress?: string;
}): Promise<PlanResponse> {
  const endpoint = `${appConfig.oneaiBaseUrl}${appConfig.oneaiPlanEndpoint}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(appConfig.oneaiApiKey
        ? {
            "x-api-key": appConfig.oneaiApiKey,
          }
        : {}),
    },
    body: JSON.stringify({
      type: "agent_plan",
      input: {
        goal: input.prompt,
        wallet: input.walletAddress || "not_connected",
        brand: "WAOC OneAI Agent OS",
        chain: "X Layer",
        audience: "builders / creators / founders / hackathon judges",
        tone: "high-signal, product-grade, execution-focused",
        prompt: `
You are OneAI Agent OS.

The user goal is:
${input.prompt}

Wallet:
${input.walletAddress || "not_connected"}

Generate a hackathon demo coordination output.

IMPORTANT:
You MUST return JSON in this exact format:

{
  "summary": "...",
  "tweets": ["...", "..."],
  "missions": ["...", "...", "...", "..."],
  "actions": ["...", "...", "...", "..."],
  "proofLabel": "...",
  "aiReasoning": ["...", "...", "..."],
  "rawText": "..."
}

DO NOT return tweet_zh, tweet_en, hashtags, cta, or any tweet-only schema.

Requirements:
- concise
- strong product narrative
- suitable for X Layer hackathon demo
- make the reasoning visible and easy for judges to understand
        `.trim(),
      },
      options: {
        maxAttempts: 3,
      },
    }),
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`OneAI request failed: ${res.status} - ${raw}`);
  }

  let json: OneAIGenerateResponse;
  try {
    json = JSON.parse(raw) as OneAIGenerateResponse;
  } catch {
    throw new Error(`OneAI returned non-JSON response: ${raw}`);
  }

  if (!json?.success) {
    throw new Error(
      `OneAI generation failed${json?.error ? `: ${json.error}` : "."}`,
    );
  }

  const rawText = extractRawText(json);

  return normalizePlan(json.data, rawText, json.data ?? json.raw ?? json);
}