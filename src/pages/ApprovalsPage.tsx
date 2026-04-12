import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApprovals, resolveApproval } from '@/store/approvalStore';
import { CATEGORY_LABELS, RISK_LABELS } from '@/types/approval';
import type { ApprovalCategory } from '@/types/approval';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import StateCoverage from '@/components/StateCoverage';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2, XCircle, Shield, Eye,
  AlertTriangle, Zap, Globe, FileEdit, Terminal, Database,
  Calendar, HelpCircle, FileText, MessageSquare, FolderOpen,
  Inbox, RotateCcw, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Approvals types ───────────────────────────────────────────────────────────

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

const RISK_BORDER: Record<string, string> = {
  low: 'border-status-working/30',
  medium: 'border-status-waiting/30',
  high: 'border-destructive/30',
};

// ── Done Work types ───────────────────────────────────────────────────────────

type ReviewStatus = 'awaiting' | 'approved' | 'sent-back';

interface WorkItem {
  id: string;
  agentId: string;
  agentName: string;
  agentColor: string;
  taskTitle: string;
  completedAt: Date;
  output: string;
  status: ReviewStatus;
  feedback?: string;
}

const MOCK_WORK: WorkItem[] = [
  {
    id: 'w1',
    agentId: 'scout',
    agentName: 'Scout',
    agentColor: '#4A6FA5',
    taskTitle: 'Research top AI tools released in Q1 2026',
    completedAt: new Date(Date.now() - 35 * 60 * 1000),
    output: `Here's a summary of the top AI tools released in Q1 2026:\n\n1. **Gemini Ultra 2** — Google's multimodal flagship. Strongest at long-context document analysis and real-time video understanding.\n\n2. **Claude 4 Opus** — Anthropic's reasoning model. Significantly better at multi-step planning tasks and code generation.\n\n3. **Llama 4 Scout** — Meta's 17B MoE model. Runs locally on consumer hardware. Best-in-class for edge deployment.\n\n4. **Mistral Large 3** — Strong European alternative. GDPR-compliant by design, popular in enterprise settings.\n\nWant me to go deeper on any of these?`,
    status: 'awaiting',
  },
  {
    id: 'w2',
    agentId: 'pepper',
    agentName: 'Pepper',
    agentColor: '#5B8C5A',
    taskTitle: "Organize this week's meeting notes into action items",
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    output: `Action items from this week's meetings:\n\n**Monday standup:**\n- [ ] Deploy new auth middleware to staging — due Thursday\n- [ ] Review open PRs before EOD\n\n**Wednesday product sync:**\n- [ ] Finalize Q2 roadmap doc\n- [ ] Schedule user interviews for next sprint\n\n**Friday retro:**\n- [ ] Add automated test for the checkout flow`,
    status: 'approved',
  },
  {
    id: 'w3',
    agentId: 'helper',
    agentName: 'Research Helper',
    agentColor: '#9B59B6',
    taskTitle: 'Draft a cold email for outreach to indie hackers',
    completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    output: `Subject: Quick question about your workflow\n\nHey [Name],\n\nI came across your project and loved what you're building.\n\nI'm working on Homeroom — a Sims-style office for AI agents.\n\nWould love to show you a demo. 15 minutes?\n\n— Odin`,
    status: 'sent-back',
    feedback: 'Too generic. Reference something specific about what they built.',
  },
];

// ── Shared helpers ────────────────────────────────────────────────────────────

const timeAgo = (date: Date) => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const AgentAvatar = ({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' }) => (
  <div
    className={`${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-xl flex items-center justify-center font-bold text-white shrink-0`}
    style={{ backgroundColor: color }}
  >
    {name[0]}
  </div>
);

// ── Done Work panel ───────────────────────────────────────────────────────────

const WorkReviewPanel = ({
  item,
  onApprove,
  onSendBack,
  onClose,
}: {
  item: WorkItem;
  onApprove: () => void;
  onSendBack: (fb: string) => void;
  onClose: () => void;
}) => {
  const [feedback, setFeedback] = useState('');
  return (
    <div className="flex flex-col h-full border-l border-border">
      <div className="p-5 border-b border-border flex items-start gap-3">
        <AgentAvatar name={item.agentName} color={item.agentColor} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{item.agentName}</p>
          <p className="text-xs text-muted-foreground truncate">{item.taskTitle}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{timeAgo(item.completedAt)}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none mt-0.5">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Output</p>
          <div className="bg-muted rounded-xl p-4 text-xs text-foreground whitespace-pre-wrap leading-relaxed font-mono">
            {item.output}
          </div>
        </div>
        {item.feedback && (
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
            <p className="text-[10px] font-semibold text-destructive uppercase tracking-wide mb-1">Previous feedback</p>
            <p className="text-xs text-foreground">{item.feedback}</p>
          </div>
        )}
      </div>

      {item.status === 'awaiting' && (
        <div className="p-5 border-t border-border space-y-3">
          <Textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="What worked well, or what should they change?"
            className="text-sm resize-none h-20"
          />
          <div className="flex gap-2">
            <Button
              onClick={onApprove}
              className="flex-1 bg-status-working hover:bg-status-working/90 text-white"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={!feedback.trim()}
              onClick={() => onSendBack(feedback)}
            >
              <RotateCcw className="w-4 h-4" /> Send Back
            </Button>
          </div>
          {!feedback.trim() && (
            <p className="text-[10px] text-muted-foreground text-center">Add a note to send back for rework</p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

type MainTab = 'approvals' | 'done-work';

const ApprovalsPage: React.FC = () => {
  const approvals = useApprovals();
  const navigate = useNavigate();
  const loading = useSimulatedLoading(400);

  const [mainTab, setMainTab] = useState<MainTab>('approvals');
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'resolved'>('pending');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [workItems, setWorkItems] = useState<WorkItem[]>(MOCK_WORK);
  const [workFilter, setWorkFilter] = useState<ReviewStatus | 'all'>('awaiting');
  const [selectedWork, setSelectedWork] = useState<string | null>(null);

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const awaitingWork = workItems.filter(w => w.status === 'awaiting').length;
  const totalBadge = pendingCount + awaitingWork;

  const reviewingRequest = reviewingId ? approvals.find(a => a.id === reviewingId) : null;
  const selectedWorkItem = workItems.find(w => w.id === selectedWork) ?? null;

  const filteredApprovals = approvals.filter(a =>
    approvalFilter === 'pending' ? a.status === 'pending' : a.status !== 'pending'
  );

  const filteredWork = workFilter === 'all'
    ? workItems
    : workItems.filter(w => w.status === workFilter);

  const handleApprove = (id: string, name: string) => {
    resolveApproval(id, 'approved');
    toast.success(`Approved request from ${name}`);
    if (reviewingId === id) setReviewingId(null);
  };

  const handleDeny = (id: string, name: string) => {
    resolveApproval(id, 'denied');
    toast.success(`Denied request from ${name}`);
    if (reviewingId === id) setReviewingId(null);
  };

  const handleWorkApprove = (id: string) => {
    setWorkItems(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' } : w));
    setSelectedWork(null);
    toast.success('Work approved');
  };

  const handleWorkSendBack = (id: string, feedback: string) => {
    setWorkItems(prev => prev.map(w => w.id === id ? { ...w, status: 'sent-back', feedback } : w));
    setSelectedWork(null);
    toast.success('Sent back with feedback');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="px-6 pt-6 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-2xl text-foreground">Your Desk</h1>
            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium rounded-full border border-border">Preview -- not yet wired to backend</span>
            {totalBadge > 0 && (
              <span className="px-2 py-0.5 bg-status-waiting/15 text-status-waiting text-xs font-bold rounded-full">
                {totalBadge} pending
              </span>
            )}
          </div>
          {mainTab === 'approvals' && pendingCount > 0 && (
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
        <p className="text-sm text-muted-foreground mb-4">
          Requests waiting for your decision and work waiting for your review.
        </p>

        {/* Main tabs */}
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setMainTab('approvals')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative flex items-center gap-2 ${
              mainTab === 'approvals'
                ? 'text-foreground border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4" /> Approvals
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 bg-status-waiting/20 text-status-waiting text-[10px] font-bold rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMainTab('done-work')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative flex items-center gap-2 ${
              mainTab === 'done-work'
                ? 'text-foreground border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Done Work
            {awaitingWork > 0 && (
              <span className="px-1.5 py-0.5 bg-status-waiting/20 text-status-waiting text-[10px] font-bold rounded-full">
                {awaitingWork}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Approvals tab ── */}
        {mainTab === 'approvals' && (
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {/* Sub-filter */}
            <div className="flex gap-1.5 mb-4">
              {(['pending', 'resolved'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setApprovalFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                    approvalFilter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {f}
                  <span className="ml-1 text-[10px]">
                    ({approvals.filter(a => f === 'pending' ? a.status === 'pending' : a.status !== 'pending').length})
                  </span>
                </button>
              ))}
            </div>

            <StateCoverage loading={loading} loadingRows={4}>
              <div className="space-y-3 max-w-2xl">
                {filteredApprovals.map(req => {
                  const CatIcon = CATEGORY_ICONS[req.category];
                  return (
                    <div
                      key={req.id}
                      className={`p-4 bg-card border rounded-xl transition-all ${
                        req.status === 'pending' ? 'border-border' : 'border-border/50 opacity-70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button onClick={() => navigate(`/agents/${req.agentId}`)}>
                          <AgentAvatar name={req.agentName} color={req.agentColor} />
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
                                req.status === 'approved'
                                  ? 'bg-status-working/10 text-status-working'
                                  : 'bg-destructive/10 text-destructive'
                              }`}>
                                {req.status === 'approved' ? 'Approved' : 'Denied'}
                              </span>
                            )}
                          </div>
                        </div>
                        {req.status === 'pending' && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm" variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeny(req.id, req.agentName)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs"
                              onClick={() => setReviewingId(req.id)}>
                              <Eye className="w-4 h-4" /> Review
                            </Button>
                            <Button size="sm" className="h-8 text-xs"
                              onClick={() => handleApprove(req.id, req.agentName)}>
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredApprovals.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-xl bg-status-working/10 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-status-working" />
                    </div>
                    <p className="text-foreground font-medium">All clear</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {approvalFilter === 'pending'
                        ? 'No agents waiting for approval right now'
                        : 'Nothing resolved yet'}
                    </p>
                  </div>
                )}
              </div>
            </StateCoverage>
          </div>
        )}

        {/* ── Done Work tab ── */}
        {mainTab === 'done-work' && (
          <>
            <div className={`flex flex-col overflow-hidden ${selectedWorkItem ? 'w-1/2' : 'flex-1'}`}>
              {/* Sub-filter */}
              <div className="px-6 pt-4 pb-3 shrink-0">
                <div className="flex gap-1 border-b border-border">
                  {([
                    { key: 'awaiting', label: 'Awaiting Review' },
                    { key: 'approved', label: 'Approved' },
                    { key: 'sent-back', label: 'Sent Back' },
                  ] as const).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setWorkFilter(f.key)}
                      className={`px-3 py-2 text-xs font-medium transition-colors relative ${
                        workFilter === f.key
                          ? 'text-foreground border-b-2 border-primary -mb-px'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {f.label}
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        ({workItems.filter(w => w.status === f.key).length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
                {filteredWork.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Nothing here</p>
                    <p className="text-xs text-muted-foreground">Your agents are still working on it.</p>
                  </div>
                ) : (
                  filteredWork.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedWork(item.id === selectedWork ? null : item.id)}
                      className={`p-4 bg-card border rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                        selectedWork === item.id ? 'border-primary/50 shadow-sm' : 'border-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AgentAvatar name={item.agentName} color={item.agentColor} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate mb-0.5">{item.taskTitle}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {item.agentName} · {timeAgo(item.completedAt)}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.output.slice(0, 100)}…
                          </p>
                        </div>
                        <div className="shrink-0">
                          {item.status === 'awaiting' && (
                            <Badge className="bg-status-waiting/15 text-status-waiting border-none text-[10px]">Review</Badge>
                          )}
                          {item.status === 'approved' && (
                            <Badge className="bg-status-working/15 text-status-working border-none text-[10px]">Approved</Badge>
                          )}
                          {item.status === 'sent-back' && (
                            <Badge className="bg-destructive/10 text-destructive border-none text-[10px]">Sent Back</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Review panel */}
            {selectedWorkItem && (
              <div className="w-1/2 flex flex-col overflow-hidden">
                <WorkReviewPanel
                  item={selectedWorkItem}
                  onApprove={() => handleWorkApprove(selectedWorkItem.id)}
                  onSendBack={fb => handleWorkSendBack(selectedWorkItem.id, fb)}
                  onClose={() => setSelectedWork(null)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Approval Review Dialog */}
      <Dialog open={!!reviewingRequest} onOpenChange={open => { if (!open) setReviewingId(null); }}>
        {reviewingRequest && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <AgentAvatar name={reviewingRequest.agentName} color={reviewingRequest.agentColor} />
                <div>
                  <span className="text-base">{reviewingRequest.title}</span>
                  <p className="text-xs font-normal text-muted-foreground mt-0.5">
                    from {reviewingRequest.agentName} · {timeAgo(reviewingRequest.createdAt)}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${RISK_COLORS[reviewingRequest.risk]}`}>
                  {RISK_LABELS[reviewingRequest.risk]}
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full flex items-center gap-1">
                  {React.createElement(CATEGORY_ICONS[reviewingRequest.category], { className: 'w-3 h-3' })}
                  {CATEGORY_LABELS[reviewingRequest.category]}
                </span>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Request</p>
                <p className="text-sm text-foreground">{reviewingRequest.detail}</p>
              </div>
              {reviewingRequest.context && (
                <div className={`p-3 border rounded-xl ${RISK_BORDER[reviewingRequest.risk]}`}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Context
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{reviewingRequest.context}</p>
                </div>
              )}
              {reviewingRequest.reasoning && (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Why it needs this
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{reviewingRequest.reasoning}</p>
                </div>
              )}
              {reviewingRequest.affectedPaths && reviewingRequest.affectedPaths.length > 0 && (
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" /> What's affected
                  </p>
                  <div className="space-y-1">
                    {reviewingRequest.affectedPaths.map((path, i) => (
                      <p key={i} className="text-xs text-foreground font-mono bg-muted px-2 py-1 rounded">{path}</p>
                    ))}
                  </div>
                </div>
              )}
              {reviewingRequest.risk === 'high' && (
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-destructive">High risk action</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This action could modify files or make changes that are difficult to undo. Review carefully.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDeny(reviewingRequest.id, reviewingRequest.agentName)}>
                <XCircle className="w-4 h-4" /> Deny
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => setReviewingId(null)}>Close</Button>
              <Button onClick={() => handleApprove(reviewingRequest.id, reviewingRequest.agentName)}>
                <CheckCircle2 className="w-4 h-4" /> Approve
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default ApprovalsPage;
