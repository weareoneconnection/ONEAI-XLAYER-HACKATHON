export type PlanResponse = {
  summary: string;
  tweets: string[];
  missions: string[];
  actions: string[];
  proofLabel: string;
  aiReasoning?: string[];
  rawText?: string;
  rawJson?: unknown;
};

export type ExecuteResponse = {
  executed: boolean;
  logs?: string[];
  executionId?: string;
  status?: string;
};

export type RecordResponse = {
  txHash: string;
  explorerUrl?: string;
  recordId?: string;
};

export type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};
