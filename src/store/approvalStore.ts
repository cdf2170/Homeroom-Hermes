import { useSyncExternalStore } from 'react';
import type { ApprovalRequest, ApprovalStatus } from '@/types/approval';
import { getAgents } from '@/store/agentStore';

// Generate mock pending approvals from agents that are in 'waiting' or 'needs-attention' state
function generateMockApprovals(): ApprovalRequest[] {
  const agents = getAgents();
  const requests: ApprovalRequest[] = [];

  const templates: { category: ApprovalRequest['category']; title: string; detail: string; risk: ApprovalRequest['risk'] }[] = [
    { category: 'file-write', title: 'Write to project directory', detail: 'Wants to save research results to ~/projects/notes/', risk: 'medium' },
    { category: 'network', title: 'Access external API', detail: 'Needs to fetch data from api.example.com for analysis', risk: 'low' },
    { category: 'shell-exec', title: 'Run build command', detail: 'Wants to execute `npm run build` in the project directory', risk: 'high' },
    { category: 'tool-use', title: 'Use web scraper tool', detail: 'Requesting permission to scrape product pages for price comparison', risk: 'medium' },
    { category: 'data-access', title: 'Read database records', detail: 'Needs to query user table for report generation', risk: 'medium' },
    { category: 'schedule-change', title: 'Adjust run frequency', detail: 'Wants to increase check frequency from daily to hourly', risk: 'low' },
    { category: 'escalation', title: 'Task beyond capabilities', detail: 'Encountered an error it cannot resolve and needs human guidance', risk: 'low' },
  ];

  agents.forEach((agent, idx) => {
    // Give some agents pending approvals
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
