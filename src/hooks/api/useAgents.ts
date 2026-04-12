import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendApi } from '@/services/backendApi';
import { qk } from '@/services/queryKeys';
import { setAgentsFromBackend } from '@/store/agentStore';
import { toast } from 'sonner';
import type { SettingsView } from '@/types/views';

/** Live agent list from the backend. Falls back gracefully if backend is down. */
export function useAgents() {
  return useQuery({
    queryKey: qk.agents.all(),
    queryFn: async () => {
      const agents = await backendApi.listAgents();
      setAgentsFromBackend(agents); // keep legacy store in sync
      return agents;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

/** Full agent detail (includes permissions, schedule, memory, rules). */
export function useAgent(id: string) {
  return useQuery({
    queryKey: qk.agents.detail(id),
    queryFn: () => backendApi.getAgent(id),
    staleTime: 15_000,
    retry: 1,
    enabled: !!id,
  });
}

/** Create a new agent. On success, invalidates the agent list. */
export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; purpose?: string; smartnessLevel?: string; runtimeMode?: string }) =>
      backendApi.createAgent({ name: payload.name, purpose: payload.purpose ?? '', archetype: 'helper', smartnessLevel: payload.smartnessLevel, runtimeMode: payload.runtimeMode } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agents.all() });
    },
    onError: (e: Error) => toast.error(`Failed to create agent: ${e.message}`),
  });
}

/** Persist agent field changes to the backend. Invalidates detail + list. */
export function useUpdateAgent(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Record<string, unknown>) => backendApi.updateAgent(agentId, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agents.detail(agentId) });
      qc.invalidateQueries({ queryKey: qk.agents.all() });
    },
    onError: (e: Error) => toast.error(`Could not save: ${e.message}`),
  });
}

/** Delete an agent. Invalidates the agent list. */
export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backendApi.deleteAgent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agents.all() });
    },
    onError: (e: Error) => toast.error(`Could not delete agent: ${e.message}`),
  });
}

/** Start a run for an agent. Invalidates the runs list on success. */
export function useRunAgent(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: string) => backendApi.runAgent(agentId, input),
    onSuccess: () => {
      toast.success('Run started');
      qc.invalidateQueries({ queryKey: qk.agents.runs(agentId) });
      qc.invalidateQueries({ queryKey: qk.agents.detail(agentId) });
      qc.invalidateQueries({ queryKey: qk.runs.all() });
    },
    onError: (e: Error) => toast.error(`Run failed: ${e.message}`),
  });
}

/** Poll runs for an agent. Refetches every 2s while any run is active. */
export function useAgentRuns(agentId: string) {
  return useQuery({
    queryKey: qk.agents.runs(agentId),
    queryFn: () => backendApi.listRuns(agentId),
    enabled: !!agentId,
    refetchInterval: (query) => {
      const runs = query.state.data ?? [];
      const hasActive = runs.some(r => r.status === 'running' || r.status === 'queued');
      return hasActive ? 2000 : false;
    },
  });
}

/** Agent audit trail. */
export function useAgentActivity(agentId: string) {
  return useQuery({
    queryKey: qk.agents.activity(agentId),
    queryFn: () => backendApi.listActivity(agentId),
    enabled: !!agentId,
    staleTime: 10_000,
  });
}

/** Global audit log (all agents). Stale after 15s. */
export function useAuditLog(limit = 100) {
  return useQuery({
    queryKey: qk.audit.all(),
    queryFn: () => backendApi.listAudit(limit),
    staleTime: 15_000,
  });
}

/** All runs across all agents. Polls every 2s while any run is active. */
export function useAllRuns(limit = 100) {
  return useQuery({
    queryKey: qk.runs.all(),
    queryFn: () => backendApi.listAllRuns(limit),
    staleTime: 10_000,
    refetchInterval: (query) => {
      const runs = query.state.data ?? [];
      const hasActive = runs.some(r => r.status === 'running');
      return hasActive ? 2000 : false;
    },
  });
}

/** App-wide settings. */
export function useSettings() {
  return useQuery({
    queryKey: qk.settings.all(),
    queryFn: () => backendApi.getSettings(),
    staleTime: 60_000,
    retry: 1,
  });
}

/** Persist settings changes. */
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<SettingsView>) => backendApi.updateSettings(updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.settings.all() });
    },
    onError: (e: Error) => toast.error(`Could not save settings: ${e.message}`),
  });
}

/** Runtime health. Refetches every 30s. */
export function useRuntimeHealth() {
  return useQuery({
    queryKey: qk.health.all(),
    queryFn: () => backendApi.getHealth(),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}

/** Trust findings across all agents. */
export function useTrustFindings() {
  return useQuery({
    queryKey: qk.trust.findings(),
    queryFn: () => backendApi.listTrustFindings(),
    staleTime: 30_000,
  });
}

/** Vault sync status for a single agent (includes drift detection). */
export function useAgentVaultStatus(agentId: string) {
  return useQuery({
    queryKey: ['vault', 'agent', agentId],
    queryFn: () => backendApi.getAgentVaultStatus(agentId),
    staleTime: 15_000,
    retry: 1,
    enabled: !!agentId,
  });
}

/** Trigger vault rebuild for a single agent. */
export function useRebuildAgentVault(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => backendApi.rebuildAgentVault(agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault', 'agent', agentId] });
    },
    onError: (e: Error) => toast.error(`Vault rebuild failed: ${e.message}`),
  });
}

/** Stored credentials — returns list of connected providers with masked keys. */
export function useCredentials() {
  return useQuery({
    queryKey: qk.credentials.all(),
    queryFn: () => backendApi.listCredentials(),
    staleTime: 60_000,
    retry: 1,
  });
}

/** Save a credential to the backend and invalidate the credentials cache. */
export function useSaveCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, key }: { provider: string; key: string }) =>
      backendApi.setCredential(provider, key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.credentials.all() });
    },
    onError: (e: Error) => toast.error(`Failed to save credential: ${e.message}`),
  });
}

/** Delete a credential from the backend. */
export function useDeleteCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => backendApi.deleteCredential(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.credentials.all() });
    },
    onError: (e: Error) => toast.error(`Failed to remove credential: ${e.message}`),
  });
}
