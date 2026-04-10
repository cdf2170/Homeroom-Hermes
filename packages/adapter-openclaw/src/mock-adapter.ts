import type {
  RuntimeAdapter,
  AdapterHealth,
  AdapterModelInfo,
  AdapterAgent,
  AdapterRunHandle,
  ManagedDocSet,
} from "@homeroom/adapter-core";
import { AdapterNotFoundError } from "@homeroom/adapter-core";
import seedAgentsJson from "./fixtures/seed-agents.json" with { type: "json" };

const SEED_AGENTS: AdapterAgent[] = seedAgentsJson as AdapterAgent[];

const MOCK_MODELS: AdapterModelInfo[] = [
  { id: "mock-local", label: "Mock Local", provider: "mock", local: true },
  { id: "mock-cloud", label: "Mock Cloud", provider: "mock", local: false },
];

type MockRunState = AdapterRunHandle & { resolveAt: number };

export class MockOpenClawAdapter implements RuntimeAdapter {
  private readonly runs = new Map<string, MockRunState>();

  async health(): Promise<AdapterHealth> {
    return {
      openclawInstalled: true,
      gatewayReachable: true,
      schedulerReachable: true,
      modelsAvailable: MOCK_MODELS.map((m) => m.id),
      warnings: [],
      checkedAt: new Date().toISOString(),
    };
  }

  async listModels(): Promise<AdapterModelInfo[]> {
    return MOCK_MODELS;
  }

  async listAgents(): Promise<AdapterAgent[]> {
    return SEED_AGENTS;
  }

  async getAgent(backendRef: string): Promise<AdapterAgent> {
    const agent = SEED_AGENTS.find((a) => a.backendRef === backendRef);
    if (!agent) throw new AdapterNotFoundError(`agent:${backendRef}`);
    return agent;
  }

  async runAgent(backendRef: string, _input: string): Promise<AdapterRunHandle> {
    const runRef = `mock-run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const handle: MockRunState = {
      runRef,
      status: "running",
      startedAt: new Date(now).toISOString(),
      finishedAt: null,
      outputSummary: "",
      errorSummary: null,
      resolveAt: now + 1500, // completes after ~1.5 s
    };
    this.runs.set(runRef, handle);

    // Simulate async completion without actually blocking
    setTimeout(() => {
      const run = this.runs.get(runRef);
      if (run && run.status === "running") {
        run.status = "completed";
        run.finishedAt = new Date().toISOString();
        run.outputSummary = `Mock run completed for agent ${backendRef}. No actual execution in this phase.`;
      }
    }, 1500);

    return { ...handle };
  }

  async cancelRun(runRef: string): Promise<void> {
    const run = this.runs.get(runRef);
    if (run && run.status === "running") {
      run.status = "cancelled";
      run.finishedAt = new Date().toISOString();
    }
  }

  async getRun(runRef: string): Promise<AdapterRunHandle> {
    const run = this.runs.get(runRef);
    if (!run) throw new AdapterNotFoundError(`run:${runRef}`);
    return { ...run };
  }

  async getSchedulerState(
    _backendRef: string,
  ): Promise<{ active: boolean; nextRunAt: string | null }> {
    return { active: false, nextRunAt: null };
  }

  async readManagedDocs(_backendRef: string): Promise<ManagedDocSet> {
    // TODO(phase-3): read actual workspace files via OpenClaw bridge
    return { files: {} };
  }

  async writeManagedDocs(_backendRef: string, _docs: ManagedDocSet): Promise<void> {
    // TODO(phase-3): write compiled docs to OpenClaw workspace
  }
}

// TODO(phase-3): OpenClawCliAdapter — wraps the real OpenClaw CLI process
