import React, { useState } from 'react';
import { Inbox, CheckCircle2, RotateCcw, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAgents } from '@/store/agentStore';

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

const MOCK_ITEMS: WorkItem[] = [
  {
    id: '1',
    agentId: 'scout',
    agentName: 'Scout',
    agentColor: '#4A6FA5',
    taskTitle: 'Research top AI tools released in Q1 2026',
    completedAt: new Date(Date.now() - 35 * 60 * 1000),
    output: `Here's a summary of the top AI tools released in Q1 2026:\n\n1. **Gemini Ultra 2** — Google's multimodal flagship. Strongest at long-context document analysis and real-time video understanding.\n\n2. **Claude 4 Opus** — Anthropic's reasoning model. Significantly better at multi-step planning tasks and code generation.\n\n3. **Llama 4 Scout** — Meta's 17B MoE model. Runs locally on consumer hardware. Best-in-class for edge deployment.\n\n4. **Mistral Large 3** — Strong European alternative. GDPR-compliant by design, popular in enterprise settings.\n\nWant me to go deeper on any of these?`,
    status: 'awaiting',
  },
  {
    id: '2',
    agentId: 'pepper',
    agentName: 'Pepper',
    agentColor: '#5B8C5A',
    taskTitle: 'Organize this week\'s meeting notes into action items',
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    output: `Action items from this week's meetings:\n\n**Monday standup:**\n- [ ] Deploy new auth middleware to staging — due Thursday\n- [ ] Review open PRs before EOD\n\n**Wednesday product sync:**\n- [ ] Finalize Q2 roadmap doc — owner: you\n- [ ] Schedule user interviews for next sprint\n- [ ] Update pricing page copy\n\n**Friday retro:**\n- [ ] Add automated test for the checkout flow\n- [ ] Move staging infra to new region`,
    status: 'approved',
  },
  {
    id: '3',
    agentId: 'helper',
    agentName: 'Research Helper',
    agentColor: '#9B59B6',
    taskTitle: 'Draft a cold email for outreach to indie hackers',
    completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    output: `Subject: Quick question about your workflow\n\nHey [Name],\n\nI came across your project [Project] and loved what you're building.\n\nI'm working on Homeroom — a local control plane for AI agents. Think of it like a Sims-style office where your agents do real work.\n\nWould love to show you a demo. 15 minutes?\n\n— Odin`,
    status: 'sent-back',
    feedback: 'Too generic. Make it more specific to what they actually built. Reference something real.',
  },
];

const timeAgo = (date: Date) => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const statusConfig: Record<ReviewStatus, { label: string; className: string }> = {
  awaiting: { label: 'Awaiting Review', className: 'bg-status-waiting/15 text-status-waiting border-none' },
  approved: { label: 'Approved', className: 'bg-status-working/15 text-status-working border-none' },
  'sent-back': { label: 'Sent Back', className: 'bg-destructive/10 text-destructive border-none' },
};

const AgentInitials = ({ name, color }: { name: string; color: string }) => (
  <div
    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
    style={{ backgroundColor: color }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
);

const ReviewPanel = ({
  item,
  onApprove,
  onSendBack,
  onClose,
}: {
  item: WorkItem;
  onApprove: () => void;
  onSendBack: (feedback: string) => void;
  onClose: () => void;
}) => {
  const [feedback, setFeedback] = useState('');

  return (
    <div className="flex flex-col h-full border-l border-border bg-background">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <AgentInitials name={item.agentName} color={item.agentColor} />
          <div>
            <p className="font-semibold text-sm text-foreground">{item.agentName}</p>
            <p className="text-xs text-muted-foreground">{item.taskTitle}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge className={statusConfig[item.status].className}>{statusConfig[item.status].label}</Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeAgo(item.completedAt)}
          </span>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Output</p>
        <div className="bg-muted rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono text-xs">
          {item.output}
        </div>

        {item.feedback && (
          <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
            <p className="text-[10px] font-semibold text-destructive uppercase tracking-wide mb-1">Previous feedback</p>
            <p className="text-xs text-foreground">{item.feedback}</p>
          </div>
        )}
      </div>

      {/* Review actions */}
      {item.status === 'awaiting' && (
        <div className="p-5 border-t border-border space-y-3">
          <div>
            <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Your feedback
            </p>
            <Textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="What worked well, or what should they change?"
              className="text-sm resize-none h-20"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onApprove}
              className="flex-1 bg-status-working hover:bg-status-working/90 text-white"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => feedback.trim() && onSendBack(feedback)}
              disabled={!feedback.trim()}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4" /> Send Back
            </Button>
          </div>
          {!feedback.trim() && (
            <p className="text-[10px] text-muted-foreground text-center">Add feedback to send back for rework</p>
          )}
        </div>
      )}
    </div>
  );
};

const DoneWorkPage: React.FC = () => {
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('awaiting');
  const [items, setItems] = useState<WorkItem[]>(MOCK_ITEMS);
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const awaiting = items.filter(i => i.status === 'awaiting').length;
  const approved = items.filter(i => i.status === 'approved').length;
  const sentBack = items.filter(i => i.status === 'sent-back').length;

  const selectedItem = items.find(i => i.id === selected) ?? null;

  const handleApprove = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' } : i));
    setSelected(null);
  };

  const handleSendBack = (id: string, feedback: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'sent-back', feedback } : i));
    setSelected(null);
  };

  const FILTERS: { key: ReviewStatus | 'all'; label: string; count?: number }[] = [
    { key: 'awaiting', label: 'Awaiting Review', count: awaiting },
    { key: 'approved', label: 'Approved', count: approved },
    { key: 'sent-back', label: 'Sent Back', count: sentBack },
  ];

  return (
    <div className="h-full flex">
      {/* Left panel */}
      <div className={`flex flex-col ${selectedItem ? 'w-1/2' : 'w-full'} transition-all`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-2xl text-foreground">Done Work</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Your team's completed tasks, waiting for your verdict.
          </p>

          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-border">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 text-xs font-medium transition-colors relative ${
                  filter === f.key
                    ? 'text-foreground border-b-2 border-primary -mb-px'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    f.key === 'awaiting' ? 'bg-status-waiting/20 text-status-waiting' : 'bg-muted text-muted-foreground'
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">All clear</p>
              <p className="text-xs text-muted-foreground">Nothing on your desk right now.</p>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => setSelected(item.id === selected ? null : item.id)}
                className={`p-4 bg-card border rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                  selected === item.id ? 'border-primary/50 shadow-sm' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AgentInitials name={item.agentName} color={item.agentColor} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">{item.taskTitle}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{item.agentName} · {timeAgo(item.completedAt)}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.output.slice(0, 120)}…</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className={statusConfig[item.status].className + ' text-[10px]'}>
                      {statusConfig[item.status].label}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel — review */}
      {selectedItem && (
        <div className="w-1/2 flex flex-col">
          <ReviewPanel
            item={selectedItem}
            onApprove={() => handleApprove(selectedItem.id)}
            onSendBack={(fb) => handleSendBack(selectedItem.id, fb)}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
};

export default DoneWorkPage;
