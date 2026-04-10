import { useState, useEffect } from 'react';

/**
 * Simulates a loading delay for demo mode.
 * In production, this would be replaced by real async data fetching state.
 */
export function useSimulatedLoading(durationMs = 600): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), durationMs);
    return () => clearTimeout(t);
  }, [durationMs]);
  return loading;
}
