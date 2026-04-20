import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/services/queryKeys';
import { setConnectionStatus } from '@/lib/connection';
import { toast } from 'sonner';

const SSE_URL = 'http://127.0.0.1:5174/api/events/stream';
const MAX_RECONNECT_DELAY = 30_000;

interface SSEEvent {
  type: string;
  payload?: {
    runId?: string;
    agentId?: string;
    status?: string;
    error?: string;
  };
}

/**
 * Connects to the backend SSE stream and invalidates React Query caches
 * when real events arrive. This replaces polling for run status updates.
 *
 * Events handled:
 *   run.started    → invalidate runs + agent detail
 *   run.completed  → invalidate runs + agents + toast
 *   run.failed     → invalidate runs + agents + error toast
 *   agent.updated  → invalidate agents
 *   mirror.synced  → invalidate mirror status (alias: vault.synced)
 */
export function useSSE() {
  const queryClient = useQueryClient();
  const reconnectDelay = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let mounted = true;

    function connect() {
      if (!mounted) return;

      const es = new EventSource(SSE_URL);
      esRef.current = es;

      es.onopen = () => {
        reconnectDelay.current = 1000; // reset backoff on successful connect
        setConnectionStatus('connected');
      };

      es.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          handleEvent(data);
        } catch {
          // Ignore malformed events
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        setConnectionStatus('disconnected');

        if (!mounted) return;

        // Reconnect with exponential backoff
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
          connect();
        }, reconnectDelay.current);
      };
    }

    function handleEvent(data: SSEEvent) {
      const { type, payload } = data;
      const agentId = payload?.agentId;

      switch (type) {
        case 'ready':
          // Initial connection established — no action needed
          break;

        case 'run.started':
          if (agentId) {
            queryClient.invalidateQueries({ queryKey: qk.agents.runs(agentId) });
            queryClient.invalidateQueries({ queryKey: qk.agents.detail(agentId) });
          }
          queryClient.invalidateQueries({ queryKey: qk.runs.all() });
          break;

        case 'run.completed':
          if (agentId) {
            queryClient.invalidateQueries({ queryKey: qk.agents.runs(agentId) });
            queryClient.invalidateQueries({ queryKey: qk.agents.detail(agentId) });
          }
          queryClient.invalidateQueries({ queryKey: qk.agents.all() });
          queryClient.invalidateQueries({ queryKey: qk.runs.all() });
          toast.success('Run completed');
          break;

        case 'run.failed': {
          if (agentId) {
            queryClient.invalidateQueries({ queryKey: qk.agents.runs(agentId) });
            queryClient.invalidateQueries({ queryKey: qk.agents.detail(agentId) });
          }
          queryClient.invalidateQueries({ queryKey: qk.agents.all() });
          queryClient.invalidateQueries({ queryKey: qk.runs.all() });
          const errMsg = payload?.error ? `Run failed: ${payload.error.slice(0, 100)}` : 'Run failed';
          toast.error(errMsg);
          break;
        }

        case 'agent.updated':
          queryClient.invalidateQueries({ queryKey: qk.agents.all() });
          if (agentId) {
            queryClient.invalidateQueries({ queryKey: qk.agents.detail(agentId) });
          }
          queryClient.invalidateQueries({ queryKey: qk.trust.findings() });
          break;

        case 'mirror.synced':
        case 'vault.synced': // legacy alias
          if (agentId) {
            queryClient.invalidateQueries({ queryKey: ['mirror', 'agent', agentId] });
          }
          break;

        case 'schedule.fired':
          // Same as run.started — the scheduler triggered a run
          if (agentId) {
            queryClient.invalidateQueries({ queryKey: qk.agents.runs(agentId) });
            queryClient.invalidateQueries({ queryKey: qk.agents.detail(agentId) });
          }
          queryClient.invalidateQueries({ queryKey: qk.runs.all() });
          break;
      }
    }

    connect();

    return () => {
      mounted = false;
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [queryClient]);
}
