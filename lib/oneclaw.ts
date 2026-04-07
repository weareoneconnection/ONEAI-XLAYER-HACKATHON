import { appConfig } from "@/lib/config";
import type { ExecuteResponse, PlanResponse } from "@/lib/schemas";

type OneClawTask = {
  taskName: string;
  steps: Array<{
    id: string;
    action: string;
    input: Record<string, unknown>;
    dependsOn?: string[];
  }>;
};

type OneClawTaskRunResponse = {
  id?: string;
  status?: string;
  data?: {
    id?: string;
    status?: string;
  };
};

type OneClawTaskStep = {
  id?: string;
  stepId?: string;
  action?: string;
  status?: string;
  output?: unknown;
  error?: string;
};

type OneClawTaskStatusResponse = {
  id?: string;
  status?: string;
  steps?: OneClawTaskStep[];
  error?: string;
  message?: string;
  data?: {
    id?: string;
    status?: string;
    steps?: OneClawTaskStep[];
    error?: string;
    message?: string;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRoot<T extends { data?: any }>(payload: T | null | undefined) {
  return payload?.data ?? payload ?? null;
}

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (appConfig.oneclawToken) {
    headers.Authorization = `Bearer ${appConfig.oneclawToken}`;
  }

  return headers;
}

function getBaseUrl() {
  const baseUrl = String(appConfig.oneclawBaseUrl || "")
    .trim()
    .replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error("ONECLAW_BASE_URL not set");
  }

  return baseUrl;
}

async function readJsonOrRaw(res: Response) {
  const raw = await res.text().catch(() => "");

  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = { raw };
  }

  return { raw, json };
}

async function oneclawRunTask(task: OneClawTask) {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/v1/tasks/run`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(task),
  });

  const { raw, json } = await readJsonOrRaw(res);

  if (!res.ok) {
    throw new Error(`OneClaw request failed: ${res.status} - ${raw}`);
  }

  return json as OneClawTaskRunResponse;
}

async function oneclawGetTask(taskId: string) {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/v1/tasks/${taskId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const { raw, json } = await readJsonOrRaw(res);

  if (!res.ok) {
    throw new Error(`OneClaw GET task failed: ${res.status} - ${raw}`);
  }

  return json as OneClawTaskStatusResponse;
}

async function oneclawRunTaskAndWait(
  task: OneClawTask,
  opts?: {
    pollIntervalMs?: number;
    timeoutMs?: number;
  },
) {
  const pollIntervalMs = opts?.pollIntervalMs ?? 1500;
  const timeoutMs = opts?.timeoutMs ?? 120000;

  const created = await oneclawRunTask(task);
  const createdRoot = normalizeRoot(created);

  const taskId = String(createdRoot?.id || "").trim();

  if (!taskId) {
    throw new Error("OneClaw did not return task id");
  }

  const startedAt = Date.now();

  while (true) {
    const latest = await oneclawGetTask(taskId);
    const latestRoot = normalizeRoot(latest);

    const status = String(latestRoot?.status || "").toLowerCase();

    if (status === "success" || status === "failed" || status === "rejected") {
      return latest;
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("OneClaw task polling timed out");
    }

    await sleep(pollIntervalMs);
  }
}

function trimTweet(text: string, max = 280) {
  const clean = String(text || "").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function buildHackathonTask(input: {
  prompt: string;
  walletAddress?: string;
  plan: PlanResponse;
}): OneClawTask {
  const primaryTweet = trimTweet(input.plan.tweets?.[0] || input.prompt);
  const secondaryTweet = trimTweet(input.plan.tweets?.[1] || "");

  return {
    taskName: "xlayer_hackathon_coordination_demo",
    steps: [
      {
        id: "publish_launch_post",
        action: "social.post",
        input: {
          channel: "x",
          content: primaryTweet,
        },
      },
      {
        id: "publish_followup_post",
        action: "social.post",
        dependsOn: ["publish_launch_post"],
        input: {
          channel: "x",
          content: secondaryTweet || trimTweet(input.plan.summary),
        },
      },
      {
        id: "create_growth_mission",
        action: "file.write",
        dependsOn: ["publish_launch_post"],
        input: {
          path: "tmp/hackathon-mission.json",
          content: JSON.stringify(
            {
              walletAddress: input.walletAddress || "",
              prompt: input.prompt,
              summary: input.plan.summary,
              tweets: input.plan.tweets,
              missions: input.plan.missions,
              actions: input.plan.actions,
              proofLabel: input.plan.proofLabel,
              aiReasoning: input.plan.aiReasoning || [],
              rawText: input.plan.rawText || "",
              createdAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      },
    ],
  };
}

function mapExecutionLogs(latest: OneClawTaskStatusResponse): string[] {
  const root = normalizeRoot(latest);
  const steps = Array.isArray(root?.steps) ? root.steps : [];

  if (!steps.length) {
    return ["OneClaw execution completed"];
  }

  return steps.map((step: OneClawTaskStep, index: number) => {
    const stepId = String(step?.stepId || step?.id || `step_${index + 1}`);
    const action = String(step?.action || "unknown");
    const status = String(step?.status || "unknown");
    const error = typeof step?.error === "string" ? step.error.trim() : "";

    return error
      ? `${stepId} · ${action}: ${status} - ${error}`
      : `${stepId} · ${action}: ${status}`;
  });
}

export async function executeHackathonFlow(input: {
  prompt: string;
  walletAddress?: string;
  plan: PlanResponse;
}): Promise<ExecuteResponse> {
  const task = buildHackathonTask(input);
  const latest = await oneclawRunTaskAndWait(task, {
    pollIntervalMs: 1500,
    timeoutMs: 120000,
  });

  const root = normalizeRoot(latest);
  const status = String(root?.status || "unknown").toLowerCase();

  return {
    executed: status === "success",
    logs: mapExecutionLogs(latest),
    executionId: String(root?.id || ""),
    status: String(root?.status || "unknown"),
  };
}