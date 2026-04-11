/**
 * useBackendSync.ts
 *
 * Called once from App.tsx on mount.
 * 1. Pings the backend
 * 2. If reachable → fetches real agents and replaces mock data in the store
 * 3. If unreachable → stays in demo mode with mock data
 *
 * This is the only place that decides "real vs demo".
 * Everything else in the app just reads from the stores as normal.
 */

import { useEffect } from 'react';
import { probeBackend } from '@/lib/connection';
import { backendApi } from '@/services/backendApi';
import { setAgentsFromBackend } from '@/store/agentStore';

export function useBackendSync() {
  useEffect(() => {
    async function init() {
      const connected = await probeBackend();
      if (!connected) {
        console.info('[Homeroom] Backend not reachable — running in demo mode');
        return;
      }
      console.info('[Homeroom] Backend connected — loading real data');
      try {
        const agents = await backendApi.listAgents();
        setAgentsFromBackend(agents);
      } catch (err) {
        console.warn('[Homeroom] Failed to load agents from backend:', err);
      }
    }
    init();
  }, []);
}
