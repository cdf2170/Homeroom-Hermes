// Adapter-level types — these are the raw shapes the adapter layer returns.
// They are NOT view models; the service layer projects them into domain types.

export interface AdapterHealth {
  openclawInstalled: boolean;
  gatewayReachable: boolean;
  schedulerReachable: boolean;
  modelsAvailable: string[];
  warnings: string[];
  checkedAt: string; // ISO datetime
}

export interface AdapterModelInfo {
  id: string;
  label: string;
  provider: string;
  local: boolean;
}

export interface AdapterAgent {
  backendRef: string;
  name: string;
  workspacePath: string | null;
  modelRef: string | null;
  schedulerActive: boolean;
  state: "idle" | "running" | "error" | "unknown";
}

export interface AdapterRunHandle {
  runRef: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  finishedAt: string | null;
  outputSummary: string;
  errorSummary: string | null;
}

export interface ManagedDocSet {
  /** Map of filename → file content */
  files: Record<string, string>;
}
