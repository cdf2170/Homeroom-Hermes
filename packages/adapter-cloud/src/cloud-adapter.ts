/**
 * CloudAdapter — routes to cloud LLM providers via direct fetch (no SDK dependencies).
 *
 * Security model:
 *   - API keys are passed in at construction time; never stored in SQLite or logs.
 *   - Health check is purely local (key presence check) — no live API call.
 *   - All requests use HTTPS; TLS is enforced by the runtime environment.
 *   - A hard timeout (default 60 s) prevents hanging connections.
 *
 * Supported providers: openai, anthropic, google, mistral.
 */

import type {
  RuntimeAdapter,
  AdapterHealth,
  AdapterModelInfo,
  AdapterAgent,
  AdapterRunHandle,
  ManagedDocSet,
} from "@homeroom/adapter-core";
import { AdapterNotFoundError } from "@homeroom/adapter-core";

export type CloudProvider = "openai" | "anthropic" | "google" | "mistral";

export interface CloudAdapterOptions {
  provider: CloudProvider;
  model: string;
  /** API key for the provider. If empty, health reports degraded. */
  apiKey: string;
  /** Max milliseconds to wait for a response. Default: 60000 */
  timeoutMs?: number;
}

type RunState = AdapterRunHandle & { settled: boolean };

// ── provider metadata ──────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<CloudProvider, string> = {
  openai:    "OpenAI",
  anthropic: "Anthropic",
  google:    "Google Gemini",
  mistral:   "Mistral",
};

// ── helpers ────────────────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(model: string, apiKey: string, input: string, timeoutMs: number): Promise<string> {
  const res = await fetchWithTimeout(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: input }],
      }),
    },
    timeoutMs,
  );
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 500);
    throw new Error(`OpenAI returned HTTP ${res.status}: ${text}`);
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return body.choices?.[0]?.message?.content?.trim() ?? "(no output)";
}

async function callAnthropic(model: string, apiKey: string, input: string, timeoutMs: number): Promise<string> {
  const res = await fetchWithTimeout(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: input }],
      }),
    },
    timeoutMs,
  );
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 500);
    throw new Error(`Anthropic returned HTTP ${res.status}: ${text}`);
  }
  const body = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const textBlock = body.content?.find((c) => c.type === "text");
  return textBlock?.text?.trim() ?? "(no output)";
}

async function callGoogle(model: string, apiKey: string, input: string, timeoutMs: number): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: input }] }],
      }),
    },
    timeoutMs,
  );
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 500);
    throw new Error(`Google Gemini returned HTTP ${res.status}: ${text}`);
  }
  const body = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text ?? "(no output)";
}

async function callMistral(model: string, apiKey: string, input: string, timeoutMs: number): Promise<string> {
  const res = await fetchWithTimeout(
    "https://api.mistral.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: input }],
      }),
    },
    timeoutMs,
  );
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 500);
    throw new Error(`Mistral returned HTTP ${res.status}: ${text}`);
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return body.choices?.[0]?.message?.content?.trim() ?? "(no output)";
}

// ── adapter ────────────────────────────────────────────────────────────────────

export class CloudAdapter implements RuntimeAdapter {
  private readonly provider: CloudProvider;
  private readonly model: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly runs = new Map<string, RunState>();

  constructor(opts: CloudAdapterOptions) {
    this.provider = opts.provider;
    this.model = opts.model;
    this.apiKey = opts.apiKey;
    this.timeoutMs = opts.timeoutMs ?? 60_000;
  }

  async health(): Promise<AdapterHealth> {
    const hasKey = this.apiKey.trim().length > 0;
    const label = PROVIDER_LABELS[this.provider];
    return {
      openclawInstalled: hasKey,
      gatewayReachable: hasKey,
      schedulerReachable: hasKey,
      modelsAvailable: hasKey ? [this.model] : [],
      warnings: hasKey
        ? []
        : [`No API key configured for ${label}. Set via POST /api/credentials/${this.provider}`],
      checkedAt: new Date().toISOString(),
    };
  }

  async listModels(): Promise<AdapterModelInfo[]> {
    if (!this.apiKey.trim()) return [];
    return [
      {
        id: this.model,
        label: `${PROVIDER_LABELS[this.provider]} — ${this.model}`,
        provider: this.provider,
        local: false,
      },
    ];
  }

  async listAgents(): Promise<AdapterAgent[]> {
    return [];
  }

  async getAgent(backendRef: string): Promise<AdapterAgent> {
    return {
      backendRef,
      name: backendRef,
      workspacePath: null,
      modelRef: this.model,
      schedulerActive: false,
      state: "idle",
    };
  }

  async runAgent(backendRef: string, input: string, _modelRef?: string | null, _policy?: unknown): Promise<AdapterRunHandle> {
    const runRef = `cloud-${this.provider}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const handle: RunState = {
      runRef,
      status: "running",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      outputSummary: "",
      errorSummary: null,
      settled: false,
    };
    this.runs.set(runRef, handle);

    this._execute(runRef, backendRef, input).catch(() => {});

    return {
      runRef: handle.runRef,
      status: handle.status,
      startedAt: handle.startedAt,
      finishedAt: null,
      outputSummary: "",
      errorSummary: null,
    };
  }

  private async _execute(runRef: string, _backendRef: string, input: string): Promise<void> {
    const handle = this.runs.get(runRef);
    if (!handle) return;

    if (!this.apiKey.trim()) {
      handle.status = "failed";
      handle.finishedAt = new Date().toISOString();
      handle.errorSummary = `No API key configured for provider: ${this.provider}`;
      handle.settled = true;
      return;
    }

    try {
      let output: string;
      switch (this.provider) {
        case "openai":
          output = await callOpenAI(this.model, this.apiKey, input, this.timeoutMs);
          break;
        case "anthropic":
          output = await callAnthropic(this.model, this.apiKey, input, this.timeoutMs);
          break;
        case "google":
          output = await callGoogle(this.model, this.apiKey, input, this.timeoutMs);
          break;
        case "mistral":
          output = await callMistral(this.model, this.apiKey, input, this.timeoutMs);
          break;
        default: {
          const _exhaustive: never = this.provider;
          void _exhaustive;
          throw new Error(`Unknown provider: ${String(this.provider)}`);
        }
      }

      handle.status = "completed";
      handle.finishedAt = new Date().toISOString();
      handle.outputSummary = output.slice(0, 2000);
      handle.settled = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      handle.status = "failed";
      handle.finishedAt = new Date().toISOString();
      handle.errorSummary = msg.slice(0, 2000);
      handle.settled = true;
    }
  }

  async cancelRun(runRef: string): Promise<void> {
    const run = this.runs.get(runRef);
    if (run && run.status === "running") {
      run.status = "cancelled";
      run.finishedAt = new Date().toISOString();
      run.settled = true;
    }
  }

  async getRun(runRef: string): Promise<AdapterRunHandle> {
    const run = this.runs.get(runRef);
    if (!run) throw new AdapterNotFoundError(`run:${runRef}`);
    return {
      runRef: run.runRef,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      outputSummary: run.outputSummary,
      errorSummary: run.errorSummary,
    };
  }

  async getSchedulerState(
    _backendRef: string,
  ): Promise<{ active: boolean; nextRunAt: string | null }> {
    return { active: false, nextRunAt: null };
  }

  async readManagedDocs(_backendRef: string): Promise<ManagedDocSet> {
    return { files: {} };
  }

  async writeManagedDocs(_backendRef: string, _docs: ManagedDocSet): Promise<void> {
    // Phase 3+: not applicable to cloud providers
  }
}
