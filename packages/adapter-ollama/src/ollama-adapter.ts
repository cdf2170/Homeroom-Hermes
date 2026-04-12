/**
 * OllamaAdapter — wraps the Ollama local REST API.
 *
 * Security model:
 *   - Communicates only with 127.0.0.1:11434 by default (configurable).
 *   - All input is sent as JSON body — no shell interpolation possible.
 *   - A hard timeout (default 120 s) prevents hanging connections.
 *   - No credentials are required or stored.
 *
 * Health check: GET /api/tags — if reachable, runtime is up.
 * List models:  GET /api/tags → .models[].name
 * Run agent:    POST /api/chat with stream: false
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

export interface OllamaAdapterOptions {
  /** Base URL for the Ollama API. Default: http://127.0.0.1:11434 */
  baseUrl?: string;
  /** Model name to use. Default: nous-hermes2 */
  model?: string;
  /** Max milliseconds to wait for a response. Default: 120000 */
  timeoutMs?: number;
}

type RunState = AdapterRunHandle & { settled: boolean };

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

// ── adapter ────────────────────────────────────────────────────────────────────

export class OllamaAdapter implements RuntimeAdapter {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly runs = new Map<string, RunState>();

  constructor(opts: OllamaAdapterOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? "http://127.0.0.1:11434").replace(/\/$/, "");
    this.model = opts.model ?? "nous-hermes2";
    this.timeoutMs = opts.timeoutMs ?? 120_000;
  }

  async health(): Promise<AdapterHealth> {
    try {
      const res = await fetchWithTimeout(
        `${this.baseUrl}/api/tags`,
        { method: "GET" },
        5_000,
      );
      if (!res.ok) {
        return {
          openclawInstalled: false,
          gatewayReachable: false,
          schedulerReachable: false,
          modelsAvailable: [],
          warnings: [`Ollama /api/tags returned HTTP ${res.status}`],
          checkedAt: new Date().toISOString(),
        };
      }
      const body = (await res.json()) as { models?: Array<{ name: string }> };
      const models = (body.models ?? []).map((m) => m.name);
      return {
        openclawInstalled: true,
        gatewayReachable: true,
        schedulerReachable: true,
        modelsAvailable: models.length > 0 ? models : ["(no models pulled)"],
        warnings: [],
        checkedAt: new Date().toISOString(),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        openclawInstalled: false,
        gatewayReachable: false,
        schedulerReachable: false,
        modelsAvailable: [],
        warnings: [
          `Ollama not reachable at ${this.baseUrl}: ${msg}. Start with: ollama serve`,
        ],
        checkedAt: new Date().toISOString(),
      };
    }
  }

  async listModels(): Promise<AdapterModelInfo[]> {
    try {
      const res = await fetchWithTimeout(
        `${this.baseUrl}/api/tags`,
        { method: "GET" },
        5_000,
      );
      if (!res.ok) return [];
      const body = (await res.json()) as { models?: Array<{ name: string }> };
      return (body.models ?? []).map((m) => ({
        id: m.name,
        label: m.name,
        provider: "ollama",
        local: true,
      }));
    } catch {
      return [];
    }
  }

  async listAgents(): Promise<AdapterAgent[]> {
    // Ollama has no concept of persistent agents; return empty.
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

  async runAgent(backendRef: string, input: string, _modelRef?: string | null): Promise<AdapterRunHandle> {
    const runRef = `ollama-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

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

    // Fire-and-forget
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

    try {
      const res = await fetchWithTimeout(
        `${this.baseUrl}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: "user", content: input }],
            stream: false,
          }),
        },
        this.timeoutMs,
      );

      if (!res.ok) {
        const text = (await res.text().catch(() => "")).slice(0, 2000);
        handle.status = "failed";
        handle.finishedAt = new Date().toISOString();
        handle.errorSummary = `Ollama returned HTTP ${res.status}: ${text}`;
        handle.settled = true;
        return;
      }

      const body = (await res.json()) as { message?: { content?: string } };
      const content = (body.message?.content ?? "(no output)").trim().slice(0, 2000);

      handle.status = "completed";
      handle.finishedAt = new Date().toISOString();
      handle.outputSummary = content;
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
    // Phase 3+: not applicable to Ollama
  }
}
