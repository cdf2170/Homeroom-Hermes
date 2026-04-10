import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApprovals, resolveApproval } from '@/store/approvalStore';
import { CATEGORY_LABELS, RISK_LABELS } from '@/types/approval';
import type { ApprovalStatus, ApprovalCategory } from '@/types/approval';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, XCircle, Clock, Shield, ArrowRight,
  AlertTriangle, Zap, Globe, FileEdit, Terminal, Database,
  Calendar, HelpCircle, Filter,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<ApprovalCategory, React.ElementType> = {
  'tool-use': Zap,
  'network': Globe,
  'file-write': FileEdit,
  'shell-exec': Terminal,
  'data-access': Database,
  'schedule-change': Calendar,
  'escalation': HelpCircle,
};

const RISK_COLORS: Record<string, string> = {
  low: 'bg-status-working/10 text-status-working',
  medium: 'bg-status-waiting/10 text-status-waiting',
  high: 'bg-destructive/10 text-destructive',
};

type FilterTab = 'pending' | 'resolved' | 'all';

const ApprovalsPage: React.FC = () => {
  const approvals = useApprovals();
  const navigate = useNavigate();
  const [tab, setTab] = useState<FilterTab>('pending');

  const filtered = approvals.filter(a => {
    if (tab === 'pending') return a.status === 'pending';
    if (tab === 'resolved') return a.status !== 'pending';
    return true;
  });

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  const handleApprove = (id: string, name: string) => {
    resolveApproval(id, 'approved');
    toast.success(`Approved request from ${name}`);
  };

  const handleDeny = (id: string, name: string) => {
    resolveApproval(id, 'denied');
    toast.success(`Denied request from ${name}`);
  };

  const timeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Approvals</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount === 0
              ? 'No pending requests — your agents are all clear'
              : `${pendingCount} request${pendingCount !== 1 ? 's' : ''} waiting for your decision`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                approvals.filter(a => a.status === 'pending').forEach(a => resolveApproval(a.id, 'approved'));
                toast.success(`Approved all ${pendingCount} requests`);
              }}
            >
              <CheckCircle2 className="w-4 h-4" /> Approve all
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5">
        {([
          { id: 'pending' as FilterTab, label: 'Pending', count: approvals.filter(a => a.status === 'pending').length },
          { id: 'resolved' as FilterTab, label: 'Resolved', count: approvals.filter(a => a.status !== 'pending').length },
          { id: 'all' as FilterTab, label: 'All', count: approvals.length },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1 text-[10px]">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Request list */}
      <div className="space-y-3">
        {filtered.map(req => {
          const CatIcon = CATEGORY_ICONS[req.category];
          return (
            <div
              key={req.id}
              className={`p-4 bg-card border rounded-xl transition-all ${
                req.status === 'pending' ? 'border-border' : 'border-border/50 opacity-70'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Agent avatar */}
                <button
                  onClick={() => navigate(`/agents/${req.agentId}`)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 hover:scale-105 transition-transform"
                  style={{ backgroundColor: req.agentColor }}
                >
                  {req.agentName[0]}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{req.agentName}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(req.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CatIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground font-medium">{req.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{req.detail}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${RISK_COLORS[req.risk]}`}>
                      {RISK_LABELS[req.risk]}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[req.category]}
                    </span>
                    {req.status !== 'pending' && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        req.status === 'approved' ? 'bg-status-working/10 text-status-working' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {req.status === 'approved' ? 'Approved' : 'Denied'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeny(req.id, req.agentName)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleApprove(req.id, req.agentName)}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-status-working/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-status-working" />
            </div>
            <p className="text-foreground font-medium">
              {tab === 'pending' ? 'All clear!' : 'No resolved requests yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === 'pending'
                ? 'No agents are waiting for your approval right now'
                : 'Requests you approve or deny will show up here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalsPage;
