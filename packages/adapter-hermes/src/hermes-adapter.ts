/**
 * HermesAdapter — wraps the `hermes` CLI (NousResearch Hermes Agent).
 *
 * Security model:
 *   - All CLI invocations use argument arrays (no shell interpolation / injection risk).
 *   - A hard timeout (default 120 s) prevents runaway processes.
 *   - No child process receives elevated privileges.
 *   - Output is captured; only the parsed reply is stored.
 *
 * One-shot invocation: `hermes chat -q "<input>" --quiet`
 * Output is plain text (no --json flag available).
 */

import { spawn } from "child_process";
import type {
  RuntimeAdapter,
  AdapterHealth,
  AdapterModelInfo,
  AdapterAgent,
  AdapterRunHandle,
  ManagedDocSet,
} from "@homeroom/adapter-core";
import { AdapterNotFoundError } from "@homeroom/adapter-core";

export interface HermesAdapterOptions {
  /** Path to the hermes binary. Defaults to "hermes" (expects it on PATH). */
  cliPath?: string;
  /** Max seconds to wait for an agent turn. Default: 120. */
  timeoutSeconds?: number;
  /** Optional callback to retrieve an API key for a given provider name. */
  getProviderKey?: (provider: string) => Promise<string | null>;
}

type RunState = AdapterRunHandle & { settled: boolean };

// ── helpers ────────────────────────────────────────────────────────────────────

function runCli(
  cliPath: string,
  args: string[],
  timeoutMs: number,
  env?: Record<string, string>,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(cliPath, args, {
      env: env ?? { ...process.env, TERM: "dumb", NO_COLOR: "1" },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      resolve({ stdout, stderr, code: 124 }); // 124 = timeout exit code convention
    }, timeoutMs);

    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: code ?? 1 });
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      stderr += err.message;
      resolve({ stdout, stderr, code: 1 });
    });
  });
}

// ── adapter ────────────────────────────────────────────────────────────────────

export class HermesAdapter implements RuntimeAdapter {
  private readonly cli: string;
  private readonly timeoutMs: number;
  private readonly runs = new Map<string, RunState>();
  private readonly getProviderKey?: (provider: string) => Promise<string | null>;

  constructor(opts: HermesAdapterOptions = {}) {
    this.cli = opts.cliPath ?? "hermes";
    this.timeoutMs = (opts.timeoutSeconds ?? 120) * 1000;
    this.getProviderKey = opts.getProviderKey;
  }

  async health(): Promise<AdapterHealth> {
    try {
      const { code, stdout } = await runCli(this.cli, ["--version"], 5000);
      if (code !== 0) {
        return {
          openclawInstalled: false,
          gatewayReachable: false,
          schedulerReachable: false,
          modelsAvailable: [],
          warnings: ["Hermes CLI returned non-zero exit from --version check."],
          checkedAt: new Date().toISOString(),
        };
      }
      const version = stdout.trim().slice(0, 80) || "hermes";
      return {
        openclawInstalled: true,   // field name is legacy; true = runtime present
        gatewayReachable: true,
        schedulerReachable: true,
        modelsAvailable: ["hermes-default"],
        warnings: [],
        checkedAt: new Date().toISOString(),
        // Surface version in a structured way for the UI health panel
        ...({ runtimeVersion: version } as Record<string, unknown>),
      };
    } catch {
      return {
        openclawInstalled: false,
        gatewayReachable: false,
        schedulerReachable: false,
        modelsAvailable: [],
        warnings: [
          "Hermes CLI not found. Install with: npm install -g @nousresearch/hermes-agent",
        ],
        checkedAt: new Date().toISOString(),
      };
    }
  }

  async listModels(): Promise<AdapterModelInfo[]> {
    return [
      { id: "hermes-default", label: "Hermes (configured model)", provider: "hermes", local: true },
    ];
  }

  async listAgents(): Promise<AdapterAgent[]> {
    // Hermes does not expose a list command that maps to Homeroom agents.
    return [];
  }

  async getAgent(backendRef: string): Promise<AdapterAgent> {
    return {
      backendRef,
      name: backendRef,
      workspacePath: null,
      modelRef: null,
      schedulerActive: false,
      state: "idle",
    };
  }

  async runAgent(backendRef: string, input: string, modelRef?: string | null): Promise<AdapterRunHandle> {
    const runRef = `hrm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

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

    // Fire-and-forget: spawn the agent turn, update handle when done.
    this._execute(runRef, backendRef, input, modelRef ?? undefined).catch(() => {});

    return {
      runRef: handle.runRef,
      status: handle.status,
      startedAt: handle.startedAt,
      finishedAt: null,
      outputSummary: "",
      errorSummary: null,
    };
  }

  private async _execute(runRef: string, backendRef: string, input: string, modelRef?: string): Promise<void> {
    const handle = this.runs.get(runRef);
    if (!handle) return;

    // Build provider env with API keys if available
    const providerEnv: Record<string, string> = {};
    if (this.getProviderKey) {
      const envMap: Record<string, string> = {
        anthropic:  "ANTHROPIC_API_KEY",
        openai:     "OPENAI_API_KEY",
        openrouter: "OPENROUTER_API_KEY",
        groq:       "GROQ_API_KEY",
        local:      "", // no key needed
      };
      for (const [provider, envVar] of Object.entries(envMap)) {
        if (!envVar) continue;
        const key = await this.getProviderKey(provider);
        if (key) providerEnv[envVar] = key;
      }
    }

    const mergedEnv = { ...process.env, TERM: "dumb", NO_COLOR: "1", ...providerEnv };

    // hermes chat -q "<input>" --quiet [-m MODEL]  →  plain-text reply on stdout
    const args = ["chat", "-q", input, "--quiet"];
    if (modelRef) args.push("-m", modelRef);

    const { stdout, stderr, code } = await runCli(this.cli, args, this.timeoutMs, mergedEnv);

    if (code === 0) {
      const reply = stdout.trim().slice(0, 2000) || "(no output)";
      handle.status = "completed";
      handle.finishedAt = new Date().toISOString();
      handle.outputSummary = reply;
      handle.settled = true;
    } else {
      const errMsg = code === 124
        ? `Agent run timed out after ${this.timeoutMs / 1000}s`
        : (stderr || stdout || "Agent run failed").slice(0, 2000);

      handle.status = "failed";
      handle.finishedAt = new Date().toISOString();
      handle.errorSummary = errMsg;
      handle.settled = true;

      // Suppress unused-variable lint: backendRef is retained for future
      // agent-context routing (e.g. hermes --profile homeroom-<backendRef>).
      void backendRef;
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
    // Phase 3+: write compiled agent instructions to Hermes workspace
  }
}
