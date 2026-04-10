import { useSyncExternalStore } from 'react';
import type { ApprovalRequest, ApprovalStatus } from '@/types/approval';
import { getAgents } from '@/store/agentStore';

// Generate mock pending approvals from agents that are in 'waiting' or 'needs-attention' state
function generateMockApprovals(): ApprovalRequest[] {
  const agents = getAgents();
  const requests: ApprovalRequest[] = [];

  const templates: { category: ApprovalRequest['category']; title: string; detail: string; risk: ApprovalRequest['risk']; context: string; affectedPaths: string[]; reasoning: string }[] = [
    { category: 'file-write', title: 'Write to project directory', detail: 'Wants to save research results to ~/projects/notes/', risk: 'medium', context: 'While researching competitor pricing, the agent compiled a 12-page summary and needs to save it.', affectedPaths: ['~/projects/notes/competitor-analysis.md', '~/projects/notes/pricing-data.csv'], reasoning: 'The research task requires saving output files. Without write access, the results will be lost when the session ends.' },
    { category: 'network', title: 'Access external API', detail: 'Needs to fetch data from api.example.com for analysis', risk: 'low', context: 'Running a scheduled data sync task that pulls the latest metrics from your analytics provider.', affectedPaths: ['api.example.com/v2/metrics', 'api.example.com/v2/events'], reasoning: 'This is a read-only API call to fetch public metrics data. No credentials are sent beyond the API key already configured.' },
    { category: 'shell-exec', title: 'Run build command', detail: 'Wants to execute `npm run build` in the project directory', risk: 'high', context: 'After fixing a TypeScript error in src/utils/parser.ts, the agent wants to verify the build passes before marking the task complete.', affectedPaths: ['dist/', 'node_modules/.cache', 'src/utils/parser.ts'], reasoning: 'Running the build command is necessary to validate that the code changes compile correctly. This command modifies the dist/ directory and build cache.' },
    { category: 'tool-use', title: 'Use web scraper tool', detail: 'Requesting permission to scrape product pages for price comparison', risk: 'medium', context: 'You asked the agent to compare prices across 5 e-commerce sites for a specific product category.', affectedPaths: ['https://store-a.com/products', 'https://store-b.com/catalog'], reasoning: 'The scraper tool is needed to extract structured pricing data from product listing pages. Rate limiting is enabled to avoid overloading target sites.' },
    { category: 'data-access', title: 'Read database records', detail: 'Needs to query user table for report generation', risk: 'medium', context: 'Generating the weekly user engagement report you requested. Needs to aggregate login counts and feature usage.', affectedPaths: ['db.users (SELECT)', 'db.events (SELECT)', 'db.sessions (SELECT)'], reasoning: 'Read-only access to these tables is required to compute engagement metrics. No data will be modified.' },
    { category: 'schedule-change', title: 'Adjust run frequency', detail: 'Wants to increase check frequency from daily to hourly', risk: 'low', context: 'The agent noticed that the monitored endpoint has been returning intermittent errors and wants to check more frequently until it stabilizes.', affectedPaths: ['Schedule: daily → hourly', 'Estimated runs: 1/day → 24/day'], reasoning: 'Increasing frequency will help catch and report outages faster. This can be reverted once the endpoint is stable.' },
    { category: 'escalation', title: 'Task beyond capabilities', detail: 'Encountered an error it cannot resolve and needs human guidance', risk: 'low', context: 'While processing invoice data, the agent encountered records with inconsistent currency formats it cannot safely parse without risking data corruption.', affectedPaths: ['invoices/2024-Q3.csv (rows 142-156)'], reasoning: 'The currency format ambiguity (€1.234 vs $1,234) could lead to incorrect calculations. Human review is needed to clarify the expected format.' },
  ];

  agents.forEach((agent, idx) => {
    const count = agent.state === 'waiting' ? 2 : agent.state === 'needs-attention' ? 1 : idx % 3 === 0 ? 1 : 0;
    for (let i = 0; i < count; i++) {
      const t = templates[(idx * 3 + i) % templates.length];
      requests.push({
        id: `apr-${agent.id}-${i}`,
        agentId: agent.id,
        agentName: agent.name,
        agentColor: agent.appearance.outfitColor,
        category: t.category,
        title: t.title,
        detail: t.detail,
        risk: t.risk,
        status: 'pending',
        createdAt: new Date(Date.now() - (idx * 3 + i) * 600000),
        resolvedAt: null,
        resolvedBy: null,
        context: t.context,
        affectedPaths: t.affectedPaths,
        reasoning: t.reasoning,
      });
    }
  });

  return requests;
}

let approvals: ApprovalRequest[] = generateMockApprovals();
let listeners = new Set<() => void>();

function emit() { listeners.forEach(l => l()); }

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getApprovals() { return approvals; }

export function useApprovals(): ApprovalRequest[] {
  return useSyncExternalStore(subscribe, getApprovals);
}

export function resolveApproval(id: string, status: 'approved' | 'denied') {
  approvals = approvals.map(a =>
    a.id === id ? { ...a, status, resolvedAt: new Date(), resolvedBy: 'you' } : a
  );
  emit();
}

export function getPendingCount(): number {
  return approvals.filter(a => a.status === 'pending').length;
}

export function getPendingForAgent(agentId: string): ApprovalRequest[] {
  return approvals.filter(a => a.agentId === agentId && a.status === 'pending');
}
