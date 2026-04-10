export type ApprovalStatus = 'pending' | 'approved' | 'denied';
export type ApprovalCategory = 'tool-use' | 'network' | 'file-write' | 'shell-exec' | 'data-access' | 'schedule-change' | 'escalation';

export interface ApprovalRequest {
  id: string;
  agentId: string;
  agentName: string;
  agentColor: string;
  category: ApprovalCategory;
  title: string;
  detail: string;
  risk: 'low' | 'medium' | 'high';
  status: ApprovalStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  // Review context
  context?: string;        // What the agent was doing when it made this request
  affectedPaths?: string[]; // Files/resources involved
  reasoning?: string;       // Why the agent thinks it needs this
}

export const CATEGORY_LABELS: Record<ApprovalCategory, string> = {
  'tool-use': 'Tool Use',
  'network': 'Network Access',
  'file-write': 'File Write',
  'shell-exec': 'Shell Command',
  'data-access': 'Data Access',
  'schedule-change': 'Schedule Change',
  'escalation': 'Escalation',
};

export const RISK_LABELS: Record<string, string> = {
  low: 'Low risk',
  medium: 'Review recommended',
  high: 'High risk',
};
