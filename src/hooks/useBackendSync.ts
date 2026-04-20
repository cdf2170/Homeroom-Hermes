/**
 * useBackendSync — runs once on app boot.
 *
 * First-time users (no `homeroom-onboarded` flag) → /onboarding
 * Returning users with backend down               → /setup?issue=service&returning=true
 * Returning users with hermes not installed       → /setup?issue=runtime&returning=true
 * Returning users with no credentials             → /security-setup
 * Healthy returning users                         → nothing (app runs normally)
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { backendApi } from '@/services/backendApi';
import { hasCompletedOnboarding } from '@/pages/OnboardingPage';

const SETUP_ROUTE = '/setup';
const ONBOARDING_ROUTE = '/onboarding';

// Routes that are part of the setup flow — skip health check on these
const SKIP_CHECK_ROUTES = [SETUP_ROUTE, ONBOARDING_ROUTE, '/security-setup'];

export function useBackendSync() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (SKIP_CHECK_ROUTES.includes(location.pathname)) return;

    // First-time user: show onboarding intro before any install steps
    if (!hasCompletedOnboarding()) {
      navigate(ONBOARDING_ROUTE, { replace: true });
      return;
    }

    async function check() {
      let health;
      try {
        health = await backendApi.getHealth();
      } catch {
        navigate(`${SETUP_ROUTE}?issue=service&returning=true`, { replace: true });
        return;
      }

      if (!health.gatewayReachable) {
        navigate(`${SETUP_ROUTE}?issue=runtime&returning=true`, { replace: true });
        return;
      }

      // Backend is healthy — check if any credentials are configured
      try {
        const creds = await backendApi.listCredentials();
        if (creds.length === 0) {
          // No API keys configured — guide user to set one up
          navigate('/security-setup', { replace: true });
          return;
        }
      } catch {
        // Credential check failed — continue anyway, user can set up later
      }
    }

    check();
    // No ongoing polling — SSE handles connection status, useRuntimeHealth handles periodic health.
  }, [location.pathname]);
}
