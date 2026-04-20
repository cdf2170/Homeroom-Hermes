import type {
  AdapterHealth,
  AdapterModelInfo,
  AdapterAgent,
  AdapterRunHandle,
  ManagedDocSet,
} from "./types.js";

/** Execution policy that adapters must honor. */
export interface AdapterRunPolicy {
  /** 'off' means the spawned process MUST NOT reach the network. */
  networkAccess?: "off" | "limited" | "open";
}

/**
 * RuntimeAdapter defines the contract between the Homeroom service
 * and the underlying agent runtime (e.g. OpenClaw).
 *
 * All implementations must be stateless and idempotent where possible.
 * The service layer handles caching, persistence, and projection.
 */
export interface RuntimeAdapter {
  /** Check overall health of the runtime. Never throws — returns degraded health on error. */
  health(): Promise<AdapterHealth>;

  /** List available models/providers. */
  listModels(): Promise<AdapterModelInfo[]>;

  /** List agents known to the runtime. */
  listAgents(): Promise<AdapterAgent[]>;

  /** Get a single agent by its runtime reference. */
  getAgent(backendRef: string): Promise<AdapterAgent>;

  /**
   * Start a run for an agent.
   * Returns a handle immediately; use getRun to poll status.
   * @param backendRef   Runtime reference for the agent.
   * @param input        The user's request / task description.
   * @param modelRef     Optional model identifier (e.g. "anthropic/claude-3.5-sonnet").
   * @param policy       Optional execution policy. Adapters MUST honor policy.networkAccess:
   *                     when 'off', the spawned process must not reach the network.
   */
  runAgent(
    backendRef: string,
    input: string,
    modelRef?: string | null,
    policy?: AdapterRunPolicy,
  ): Promise<AdapterRunHandle>;

  /** Cancel an in-flight run. No-op if already complete. */
  cancelRun(runRef: string): Promise<void>;

  /** Poll a run by its runtime reference. */
  getRun(runRef: string): Promise<AdapterRunHandle>;

  /** Get scheduler state for an agent workspace. */
  getSchedulerState(
    backendRef: string,
  ): Promise<{ active: boolean; nextRunAt: string | null }>;

  /**
   * Read the managed doc files for an agent workspace.
   * Phase 3+: used by the compiler to detect external edits.
   */
  readManagedDocs(backendRef: string): Promise<ManagedDocSet>;

  /**
   * Write compiled doc files into the agent workspace.
   * Phase 3+: called by the compiler after a profile save.
   */
  writeManagedDocs(backendRef: string, docs: ManagedDocSet): Promise<void>;
}
