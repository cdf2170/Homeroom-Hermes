import React, { useState, useEffect } from 'react';
import AvatarPreview from '@/components/AvatarPreview';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgents, updateAgent, removeAgent } from '@/store/agentStore';
import {
  ArrowLeft, User, FileText, Sparkles, Brain, Shield, Clock, Activity,
  Settings, Play, Pause, Trash2, Power, PowerOff, Cpu, Cloud, Zap, Target,
  AlertTriangle, Pencil, Check, Plus, X, ChevronDown, ChevronUp,
  BookOpen, Wrench, Database, Users, RefreshCw, Copy, Rocket,
  Heart, Lightbulb, Bookmark, StickyNote, Pin, CheckCircle2, XCircle,
  MessageSquare, Calendar, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Agent, AgentState, OfficeZone, STATE_LABELS, ARCHETYPE_LABELS, VIBE_LABELS,
  Archetype, Vibe, SmartLevel, RuntimeMode, MemoryItem, RuleItem, RulePriority,
  CheckInFrequency, EscalationBehavior, TaskStyle, ROOM_BOUNDS,
  AgentAppearance,
} from '@/types/agent';
import { toast } from 'sonner';
import { getPendingForAgent, resolveApproval } from '@/store/approvalStore';
import { CATEGORY_LABELS } from '@/types/approval';
import { addAgent } from '@/store/agentStore';

// ── Helpers ──

const timeAgo = (date: Date) => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const stateColor = (state: string) => {
  switch (state) {
    case 'working': return 'bg-status-working';
    case 'on-break': return 'bg-status-break';
    case 'waiting': case 'needs-attention': return 'bg-status-waiting';
    case 'sleeping': case 'offline': return 'bg-status-offline';
    default: return 'bg-status-idle';
  }
};

// ── Section navigation ──

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'instructions', label: 'Instructions', icon: FileText },
  { id: 'personality', label: 'Personality', icon: Sparkles },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'rules', label: 'Rules', icon: Shield },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'schedule', label: 'Schedule', icon: Clock },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'advanced', label: 'Advanced', icon: Settings },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// ── Main Component ──

const AgentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agents = useAgents();
  const agent = agents.find(a => a.id === id);
  const [section, setSection] = useState<SectionId>('overview');

  if (!agent) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground mb-4">Agent not found</p>
        <Button variant="outline" onClick={() => navigate('/agents')}>
          <ArrowLeft className="w-4 h-4" /> Back to agents
        </Button>
      </div>
    );
  }

  const isActive = agent.state === 'working' || agent.state === 'walking';

  const handleSetState = (state: AgentState) => {
    const zoneMap: Record<AgentState, OfficeZone> = {
      working: 'work', walking: 'work', idle: 'work',
      'on-break': 'lounge', waiting: 'approval', paused: 'work',
      offline: 'quiet', sleeping: 'quiet', 'needs-attention': 'approval',
    };
    updateAgent(agent.id, {
      state, zone: zoneMap[state],
      activities: [
        { id: `act-${Date.now()}`, timestamp: new Date(), action: 'State Change', detail: `Status changed to ${STATE_LABELS[state]}` },
        ...agent.activities,
      ],
    });
    toast.success(`${agent.name} is now ${STATE_LABELS[state].toLowerCase()}`);
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Left sidebar */}
      <div className="w-56 border-r border-border bg-card/50 shrink-0 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <button onClick={() => navigate('/agents')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> All agents
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-primary-foreground relative shrink-0"
              style={{ backgroundColor: agent.appearance.outfitColor }}
            >
              {agent.name[0]}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${stateColor(agent.state)}`} />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-sm text-foreground truncate">{agent.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{agent.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stateColor(agent.state)}/10 text-foreground`}>
              {STATE_LABELS[agent.state]}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              {agent.runtimeMode === 'local' ? <><Cpu className="w-3 h-3" /> Local</> : <><Cloud className="w-3 h-3" /> Cloud</>}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map((s, idx) => {
            const Icon = s.icon;
            const isAdvancedSection = idx >= 6; // Schedule, Activity, Advanced
            const showDivider = idx === 6;
            return (
              <React.Fragment key={s.id}>
                {showDivider && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Advanced</p>
                  </div>
                )}
                <button
                  onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors ${
                    section === s.id
                      ? 'text-primary bg-primary/5 border-r-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                  {s.id === 'memory' && (agent.memoryItems?.length || 0) > 0 && (
                    <span className="ml-auto text-[9px] bg-muted rounded-full px-1.5">{agent.memoryItems.length}</span>
                  )}
                  {s.id === 'rules' && (agent.ruleItems?.length || 0) > 0 && (
                    <span className="ml-auto text-[9px] bg-muted rounded-full px-1.5">{agent.ruleItems.length}</span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Action buttons - always visible */}
        <div className="p-3 border-t border-border space-y-1 shrink-0">
          <Button size="sm" className="w-full text-xs h-7" onClick={() => { handleSetState('working'); toast.success(`Running ${agent.name} now`); }}>
            <Play className="w-3 h-3" /> Run Now
          </Button>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setSection('overview')}>
              <MessageSquare className="w-3 h-3" /> Message
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setSection('schedule')}>
              <Calendar className="w-3 h-3" /> Schedule
            </Button>
          </div>
          {isActive ? (
            <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => handleSetState('paused')}>
              <Pause className="w-3 h-3" /> Pause
            </Button>
          ) : agent.state === 'paused' ? (
            <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => handleSetState('working')}>
              <Play className="w-3 h-3" /> Resume
            </Button>
          ) : null}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="w-full text-xs h-7 text-destructive">
                <Trash2 className="w-3 h-3" /> Remove from Office
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {agent.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove this agent from your office. All configuration, memory, rules, and run history will be lost. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => { removeAgent(agent.id); navigate('/agents'); toast.success(`${agent.name} removed`); }}
                >
                  Yes, remove permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
        {section === 'overview' && <OverviewSection agent={agent} onSetState={handleSetState} />}
        {section === 'instructions' && <InstructionsSection agent={agent} />}
        {section === 'personality' && <PersonalitySection agent={agent} />}
        {section === 'memory' && <MemorySection agent={agent} />}
        {section === 'rules' && <RulesSection agent={agent} />}
        {section === 'tools' && <ToolsSection agent={agent} />}
        {section === 'schedule' && <ScheduleSection agent={agent} />}
        {section === 'activity' && <ActivitySection agent={agent} />}
        {section === 'advanced' && <AdvancedSection agent={agent} />}
      </div>
    </div>
  );
};

// ═══════════════════════════════
// OVERVIEW
// ═══════════════════════════════

const OverviewSection = ({ agent, onSetState }: { agent: Agent; onSetState: (s: AgentState) => void }) => {
  const isActive = agent.state === 'working' || agent.state === 'walking';

  return (
    <div className="space-y-6">
      <SectionHeader icon={User} title="Overview" desc="At a glance" />

      {/* Identity card with avatar */}
      <div className="flex items-start gap-5 p-4 bg-muted/30 rounded-xl border border-border">
        <div className="shrink-0">
          <AvatarPreview appearance={agent.appearance} name={agent.name} size={72} />
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <EditableField label="Agent name" value={agent.name} onSave={v => updateAgent(agent.id, { name: v })} />
            <EditableField label="Job title" value={agent.role} onSave={v => updateAgent(agent.id, { role: v })} />
          </div>
          <EditableField label="What this agent does" value={agent.purpose} onSave={v => updateAgent(agent.id, { purpose: v })} multiline />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs">
          <span className={`w-2 h-2 rounded-full ${stateColor(agent.state)}`} />
          {STATE_LABELS[agent.state]}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs">
          {agent.runtimeMode === 'local' ? <Cpu className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
          {agent.runtimeMode === 'local' ? 'Runs on your device' : agent.runtimeMode === 'cloud' ? 'Runs online' : 'Both local & cloud'}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs capitalize">
          <Zap className="w-3 h-3" /> {agent.smartnessLevel} intelligence
        </div>
      </div>

      {/* Status toggle */}
      <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
        <div>
          <p className="text-sm font-medium text-foreground">Agent enabled</p>
          <p className="text-xs text-muted-foreground">When off, this agent won't run</p>
        </div>
        <Switch
          checked={agent.enabled}
          onCheckedChange={v => {
            updateAgent(agent.id, { enabled: v, state: v ? 'idle' : 'offline', zone: v ? 'work' : 'quiet' });
            toast.success(v ? `${agent.name} enabled` : `${agent.name} disabled`);
          }}
        />
      </div>

      {/* Run now */}
      <TaskAssigner agent={agent} />

      {/* Last result */}
      {agent.runs.length > 0 && (
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Last result</p>
          <p className="text-sm text-foreground">{agent.runs[0].outputSummary || agent.runs[0].inputSummary}</p>
          <div className="flex items-center gap-2 mt-2">
            <RunBadge status={agent.runs[0].status} />
            <span className="text-xs text-muted-foreground">{timeAgo(agent.runs[0].startedAt)}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total runs" value={agent.runs.length} />
        <StatCard label="Completed" value={agent.runs.filter(r => r.status === 'completed').length} />
        <StatCard label="Last run" value={agent.lastRunAt ? timeAgo(agent.lastRunAt) : 'Never'} />
      </div>

      {/* Pending approvals for this agent */}
      <PendingApprovalsCard agent={agent} />

      {/* Safety summary */}
      <SafetySummaryCard agent={agent} />

      {/* Quick actions: Duplicate + Approve all */}
      <AgentQuickActions agent={agent} />
    </div>
  );
};

// ── Pending Approvals Card (per-agent) ──

const PendingApprovalsCard = ({ agent }: { agent: Agent }) => {
  const pending = getPendingForAgent(agent.id);
  const [, setTick] = useState(0);

  if (pending.length === 0) return null;

  const handleApprove = (id: string) => {
    resolveApproval(id, 'approved');
    setTick(t => t + 1);
    toast.success('Request approved');
  };

  const handleDeny = (id: string) => {
    resolveApproval(id, 'denied');
    setTick(t => t + 1);
    toast.success('Request denied');
  };

  return (
    <div className="p-4 bg-card border border-status-waiting/30 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-status-waiting" />
          {pending.length} pending request{pending.length !== 1 ? 's' : ''}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[10px]"
          onClick={() => {
            pending.forEach(p => resolveApproval(p.id, 'approved'));
            setTick(t => t + 1);
            toast.success(`Approved ${pending.length} requests`);
          }}
        >
          <CheckCircle2 className="w-3 h-3" /> Approve all
        </Button>
      </div>
      <div className="space-y-2">
        {pending.map(req => (
          <div key={req.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{req.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{req.detail}</p>
              <span className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[req.category]}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDeny(req.id)}>
                <XCircle className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" className="h-7 text-[10px] px-2" onClick={() => handleApprove(req.id)}>
                <CheckCircle2 className="w-3 h-3" /> Approve
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Quick Actions (Duplicate + Approve) ──

const AgentQuickActions = ({ agent }: { agent: Agent }) => {
  const navigate = useNavigate();

  const handleDuplicate = () => {
    const newId = `agent-${Date.now()}`;
    const clone: Agent = {
      ...agent,
      id: newId,
      name: `${agent.name} (copy)`,
      state: 'offline',
      zone: 'quiet',
      enabled: false,
      currentTask: null,
      lastRunAt: null,
      lastRunStatus: null,
      runs: [],
      activities: [],
    };
    addAgent(clone);
    toast.success(`Duplicated ${agent.name}`);
    navigate(`/agents/${newId}`);
  };

  const pending = getPendingForAgent(agent.id);

  return (
    <div className="flex items-center gap-2">
      {pending.length > 0 && (
        <Button
          size="sm"
          className="flex-1 text-xs h-9"
          onClick={() => {
            pending.forEach(p => resolveApproval(p.id, 'approved'));
            toast.success(`Approved ${pending.length} requests from ${agent.name}`);
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Approve {pending.length} request{pending.length !== 1 ? 's' : ''}
        </Button>
      )}
      <Button size="sm" variant="outline" className="flex-1 text-xs h-9" onClick={handleDuplicate}>
        <Copy className="w-3.5 h-3.5" /> Duplicate
      </Button>
    </div>
  );
};

// ═══════════════════════════════
// INSTRUCTIONS
// ═══════════════════════════════

// ── Markdown preview helper ──
const AgentsMdPreview = ({ agent }: { agent: Agent }) => {
  const md = [
    `# ${agent.name}`,
    '',
    agent.role ? `> ${agent.role}` : '> *(no role defined)*',
    '',
    '## How to work',
    '',
    agent.instructions || '*No instructions yet.*',
    '',
    '## Success criteria',
    '',
    agent.audienceNotes || '*Not defined yet.*',
    '',
    '## Boundaries',
    '',
    agent.environmentNotes || '*No boundaries set.*',
    '',
    `---`,
    '',
    `**Archetype:** ${ARCHETYPE_LABELS[agent.archetype]}`,
  ].join('\n');

  // Simple markdown-to-JSX renderer for preview
  const renderLines = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-foreground mb-1">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-bold text-foreground mt-4 mb-1 border-b border-border pb-1">{line.slice(3)}</h2>;
      if (line.startsWith('> ')) return <blockquote key={i} className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-3 my-1">{line.slice(2)}</blockquote>;
      if (line.startsWith('---')) return <hr key={i} className="border-border my-3" />;
      if (line.startsWith('**') && line.includes(':**')) {
        const [label, ...rest] = line.split(':**');
        return <p key={i} className="text-xs text-foreground"><span className="font-bold">{label.replace(/\*\*/g, '')}:</span> {rest.join(':**').replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) return <p key={i} className="text-xs text-muted-foreground italic">{line.replace(/\*/g, '')}</p>;
      if (line.trim() === '') return <div key={i} className="h-1" />;
      return <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* File tab bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/60 border-b border-border">
        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-mono text-[11px] font-medium text-foreground">AGENTS.md</span>
        <span className="text-[10px] text-muted-foreground ml-auto">Preview</span>
      </div>
      {/* Rendered content */}
      <div className="p-4 bg-card/50 font-sans space-y-0 max-h-[50vh] overflow-y-auto">
        {renderLines(md)}
      </div>
      {/* Raw markdown toggle */}
      <details className="border-t border-border">
        <summary className="px-3 py-2 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
          View raw markdown
        </summary>
        <pre className="px-4 py-3 text-[11px] font-mono text-muted-foreground bg-muted/30 whitespace-pre-wrap overflow-x-auto max-h-[40vh]">{md}</pre>
      </details>
    </div>
  );
};

const InstructionsSection = ({ agent }: { agent: Agent }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-0">
      {/* AGENTS.md document header — briefing style */}
      <div className="p-5 bg-muted/40 border border-border rounded-xl mb-1" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-mono text-sm font-bold text-foreground tracking-tight">AGENTS.md <span className="font-sans text-[11px] font-normal text-muted-foreground ml-1.5">— Character instruction file</span></p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                This is what <span className="font-medium text-foreground">{agent.name}</span> reads before every task. Edit it here or open it directly.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant={showPreview ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8 shrink-0 gap-1.5" onClick={() => toast.info('AGENTS.md opened in editor')}>
              <BookOpen className="w-3.5 h-3.5" /> Open AGENTS.md
            </Button>
          </div>
        </div>
      </div>

      {/* Sync indicator */}
      <div className="flex items-center gap-2 px-4 py-2 mb-6">
        <RefreshCw className="w-3 h-3 text-muted-foreground shrink-0" />
        <p className="text-[10px] text-muted-foreground">
          Changes sync to <span className="font-mono font-medium text-foreground">AGENTS.md</span> automatically. The agent picks them up on its next run.
        </p>
      </div>

      {/* ── Preview mode ── */}
      {showPreview ? (
        <AgentsMdPreview agent={agent} />
      ) : (
        <>
          {/* ── Section 1: Role ── */}
          <div className="py-4 border-b border-border">
            <div className="flex items-baseline gap-2 mb-0.5">
              <p className="text-xs font-bold text-foreground">Role</p>
              <p className="text-[10px] text-muted-foreground">— what is this agent's job in one line</p>
            </div>
            <EditableField label="" value={agent.role} onSave={v => updateAgent(agent.id, { role: v })} placeholder="e.g. Research assistant that finds and summarizes information" />
          </div>

          {/* ── Section 2: How to work ── */}
          <div className="py-4 border-b border-border">
            <div className="flex items-baseline gap-2 mb-0.5">
              <p className="text-xs font-bold text-foreground">How to work</p>
              <p className="text-[10px] text-muted-foreground">— the actual prompt and behavior rules</p>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">These are the step-by-step instructions {agent.name} follows on every task. Be specific — this is the prompt.</p>
            <EditableField
              label=""
              value={agent.instructions}
              onSave={v => updateAgent(agent.id, { instructions: v })}
              multiline
              placeholder="e.g. When I ask you to research something, find at least 3 reliable sources. Always include links. Present findings as bullet points with a summary at the top."
            />
          </div>

          {/* ── Section 3: Success criteria ── */}
          <div className="py-4 border-b border-border">
            <div className="flex items-baseline gap-2 mb-0.5">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5"><Target className="w-3 h-3 text-primary" /> What does a good output look like?</p>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">Describe what a successful result looks like so the agent knows when it's done right.</p>
            <EditableField
              label=""
              value={agent.audienceNotes || ''}
              onSave={v => updateAgent(agent.id, { audienceNotes: v })}
              multiline
              placeholder="e.g. A bullet-point summary with at least 3 sources linked. No longer than 500 words. Includes a confidence score."
            />
          </div>

          {/* ── Section 4: Boundaries ── */}
          <div className="py-4 border-b border-border">
            <div className="flex items-baseline gap-2 mb-0.5">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-status-waiting" /> What should it never do?</p>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">Hard boundaries. These also flow into the <span className="font-medium text-foreground">Trust Center</span> for ongoing monitoring.</p>
            <EditableField
              label=""
              value={agent.environmentNotes || ''}
              onSave={v => updateAgent(agent.id, { environmentNotes: v })}
              multiline
              placeholder="e.g. Never fabricate sources or citations. Never access private repos without explicit permission. Never share user data outside the workspace."
            />
          </div>

          {/* ── Section 5: Archetype ── */}
          <div className="py-4 border-b border-border">
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-xs font-bold text-foreground">Archetype</p>
              <p className="text-[10px] text-muted-foreground">— shapes how the agent thinks and approaches tasks</p>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">This isn't cosmetic — it changes the agent's reasoning style. A "helper" will ask clarifying questions; an "executor" will just do it.</p>
            <Select value={agent.archetype} onValueChange={(v) => updateAgent(agent.id, { archetype: v as any })}>
              <SelectTrigger className="h-9 text-xs max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(ARCHETYPE_LABELS) as [string, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Power-user footer */}
      <div className="flex items-center justify-between mt-5 px-4 py-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">
            Prefer editing raw markdown? Open <span className="font-mono font-medium text-foreground">AGENTS.md</span> directly.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs h-7 gap-1.5 text-primary" onClick={() => toast.info('AGENTS.md opened in editor')}>
          <BookOpen className="w-3 h-3" /> Open file
        </Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════
// PERSONALITY
// ═══════════════════════════════

const PersonalitySection = ({ agent }: { agent: Agent }) => {
  const app = agent.appearance;
  const setApp = (updates: Partial<AgentAppearance>) => updateAgent(agent.id, { appearance: { ...app, ...updates } });

  const SKIN_TONES = ['#FDDBB4', '#F1C27D', '#D2A679', '#8D5524', '#6B3A2A', '#3B1F0B'];
  const HAIR_COLORS = ['#1A1A1A', '#3B2716', '#A0522D', '#D4A44C', '#C0392B', '#8E44AD', '#F5F5DC'];
  const OUTFIT_COLORS = ['#5B8C5A', '#C06030', '#4A6FA5', '#9B59B6', '#2C3E50', '#E67E22', '#E74C3C', '#1ABC9C', '#F39C12', '#34495E'];
  const ACCENT_COLORS = ['#E67E22', '#2ECC71', '#3498DB', '#E91E63', '#F39C12', '#1ABC9C', '#9B59B6', '#E74C3C'];
  const SHOE_COLORS = ['#333333', '#5D4037', '#1A237E', '#880E4F', '#4A4A4A', '#FFFFFF'];

  const ColorRow = ({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (c: string) => void }) => (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground mb-1">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {colors.map(c => (
          <button key={c} onClick={() => onChange(c)} className={`w-6 h-6 rounded-full border-2 transition-all ${value === c ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );

  const ChipRow = <T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (v: T) => void }) => (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground mb-1">{label}</p>
      <div className="flex gap-1 flex-wrap">
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)} className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize transition-colors ${value === o ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeader icon={Sparkles} title="Personality" desc="How this agent should sound and look" />

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">How this agent should sound</p>
        <EditableField
          label=""
          value={agent.personality}
          onSave={v => updateAgent(agent.id, { personality: v })}
          multiline
          placeholder="e.g. Friendly but concise. Uses simple language. Avoids jargon."
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Tone presets</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(VIBE_LABELS) as [Vibe, string][]).map(([key, label]) => (
            <button key={key} onClick={() => updateAgent(agent.id, { vibe: key })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${agent.vibe === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Voice preset</p>
        <div className="flex flex-wrap gap-2">
          {(['neutral', 'warm', 'direct', 'playful', 'calm'] as const).map(v => (
            <button key={v} onClick={() => setApp({ voicePreset: v })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${app.voicePreset === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            >{v}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Archetype</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(ARCHETYPE_LABELS) as [Archetype, string][]).map(([key, label]) => (
            <button key={key} onClick={() => updateAgent(agent.id, { archetype: key })}
              className={`p-2.5 rounded-xl border-2 text-center text-xs font-medium transition-all ${agent.archetype === key ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* ── Appearance Editor ── */}
      <div className="border-t border-border pt-5">
        <p className="text-xs font-semibold text-foreground mb-3">Appearance</p>
        <div className="flex gap-4">
          {/* Live preview */}
          <div className="shrink-0">
            <AvatarPreview appearance={app} name={agent.name} size={120} />
          </div>
          {/* Controls */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[50vh] pr-1">
            <ChipRow label="Body type" options={['masculine', 'feminine', 'androgynous'] as AgentAppearance['bodyType'][]} value={app.bodyType || 'androgynous'} onChange={v => setApp({ bodyType: v })} />
            <ColorRow label="Skin tone" colors={SKIN_TONES} value={app.skinTone} onChange={c => setApp({ skinTone: c })} />
            <ChipRow label="Hair style" options={['short','long','curly','buzz','ponytail','bun','mohawk','braids','wavy','afro','shaved'] as AgentAppearance['hairStyle'][]} value={app.hairStyle} onChange={v => setApp({ hairStyle: v })} />
            <ColorRow label="Hair color" colors={HAIR_COLORS} value={app.hairColor} onChange={c => setApp({ hairColor: c })} />
            <ChipRow label="Outfit style" options={['casual','formal','sporty','techy','creative','cozy'] as AgentAppearance['outfitStyle'][]} value={app.outfitStyle} onChange={v => setApp({ outfitStyle: v })} />
            <ColorRow label="Outfit color" colors={OUTFIT_COLORS} value={app.outfitColor} onChange={c => setApp({ outfitColor: c })} />
            <ChipRow label="Pattern" options={['solid','striped','dotted','plaid'] as AgentAppearance['outfitPattern'][]} value={app.outfitPattern} onChange={v => setApp({ outfitPattern: v })} />
            <ColorRow label="Accent color" colors={ACCENT_COLORS} value={app.accentColor} onChange={c => setApp({ accentColor: c })} />
            <ColorRow label="Shoe color" colors={SHOE_COLORS} value={app.shoeColor} onChange={c => setApp({ shoeColor: c })} />
            <ChipRow label="Glasses" options={['none','round','square','aviator'] as AgentAppearance['glasses'][]} value={app.glasses} onChange={v => setApp({ glasses: v })} />
            <ChipRow label="Facial hair" options={['none','stubble','beard','mustache','goatee'] as AgentAppearance['facialHair'][]} value={app.facialHair} onChange={v => setApp({ facialHair: v })} />
            <ChipRow label="Headwear" options={['none','cap','beanie','headband','beret'] as AgentAppearance['headwear'][]} value={app.headwear} onChange={v => setApp({ headwear: v })} />
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Accessory</p>
              <div className="flex gap-1 flex-wrap">
                {(['none','headphones','scarf','watch','necklace','earbuds'] as AgentAppearance['accessories'][number][]).map(acc => (
                  <button key={acc} onClick={() => setApp({ accessories: [acc] })}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize transition-colors ${app.accessories?.[0] === acc ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                  >{acc}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════
// MEMORY
// ═══════════════════════════════

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  preference: Heart,
  context: Bookmark,
  fact: Lightbulb,
  note: StickyNote,
};

const MemorySection = ({ agent }: { agent: Agent }) => {
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('note');
  const items = agent.memoryItems || [];

  // Pinned items float to top
  const sortedItems = [...items].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const addItem = () => {
    if (!newContent.trim()) return;
    const item: MemoryItem = {
      id: `mem-${Date.now()}`,
      content: newContent.trim(),
      category: newCategory,
      pinned: false,
      createdAt: new Date(),
    };
    updateAgent(agent.id, { memoryItems: [...items, item] });
    setNewContent('');
    toast.success('Memory added');
  };

  const removeItem = (itemId: string) => {
    updateAgent(agent.id, { memoryItems: items.filter(i => i.id !== itemId) });
    toast.success('Memory removed');
  };

  const togglePin = (itemId: string) => {
    updateAgent(agent.id, { memoryItems: items.map(i => i.id === itemId ? { ...i, pinned: !i.pinned } : i) });
  };

  const categoryColor: Record<string, string> = {
    preference: 'bg-primary/10 text-primary',
    context: 'bg-secondary/10 text-secondary',
    fact: 'bg-status-working/10 text-status-working',
    note: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={Brain} title="Memory" desc="Memories help this agent remember things between conversations" />

      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          Memory helps your agent remember important things about you, your preferences, and your work.
          Add facts, preferences, or context that should persist across conversations.
        </p>
      </div>

      {/* Add new memory */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">Add a memory</p>
        <Textarea
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="e.g. I prefer bullet-point summaries over long paragraphs"
          className="min-h-[60px] text-sm resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {(['preference', 'context', 'fact', 'note'] as const).map(c => {
              const CatIcon = CATEGORY_ICONS[c];
              return (
                <button
                  key={c}
                  onClick={() => setNewCategory(c)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium capitalize transition-colors flex items-center gap-1 ${
                    newCategory === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <CatIcon className="w-3 h-3" />
                  {c}
                </button>
              );
            })}
          </div>
          <Button size="sm" onClick={addItem} disabled={!newContent.trim()} className="text-xs h-7">
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      </div>

      {/* Memory items */}
      <div className="space-y-2">
        {sortedItems.map(item => {
          const CatIcon = CATEGORY_ICONS[item.category] || StickyNote;
          return (
            <div key={item.id} className={`flex items-start gap-3 p-3 bg-card border rounded-xl group transition-all ${item.pinned ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
              <div className="mt-0.5 shrink-0">
                <CatIcon className={`w-4 h-4 ${item.pinned ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{item.content}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${categoryColor[item.category]}`}>{item.category}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(item.createdAt)}</span>
                  {item.pinned && <span className="text-[10px] text-primary font-medium flex items-center gap-0.5"><Pin className="w-2.5 h-2.5" /> Pinned</span>}
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => togglePin(item.id)} className={`p-1 rounded transition-colors ${item.pinned ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="text-center py-10 border border-dashed border-border rounded-xl px-6">
            <Brain className="w-8 h-8 mx-auto text-muted-foreground/60 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No memory yet</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              Add a few things this agent should remember, like your writing preferences or important facts.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: 'User preference', category: 'preference' as const, placeholder: 'e.g. I prefer bullet-point summaries' },
                { label: 'Important fact', category: 'fact' as const, placeholder: 'e.g. Our fiscal year starts in April' },
                { label: 'Standing context', category: 'context' as const, placeholder: 'e.g. I work in a 4-person marketing team' },
              ].map(chip => (
                <button
                  key={chip.label}
                  onClick={() => { setNewCategory(chip.category); setNewContent(chip.placeholder); }}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-medium hover:bg-primary/20 transition-colors"
                >
                  + {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notes area */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">General memory notes</p>
        <EditableField
          label=""
          value={agent.memoryNotes || ''}
          onSave={v => updateAgent(agent.id, { memoryNotes: v })}
          multiline
          placeholder="Free-form notes about what this agent should keep track of..."
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════
// RULES
// ═══════════════════════════════

const RulesSection = ({ agent }: { agent: Agent }) => {
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<RulePriority>('preference');
  const items = agent.ruleItems || [];

  // Group by priority: hard-rule first, then safe, then preference
  const priorityOrder: Record<RulePriority, number> = { 'hard-rule': 0, safe: 1, preference: 2 };
  const sortedItems = [...items].sort((a, b) => {
    const po = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (po !== 0) return po;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const addItem = () => {
    if (!newContent.trim()) return;
    const item: RuleItem = {
      id: `rule-${Date.now()}`,
      content: newContent.trim(),
      priority: newPriority,
      enabled: true,
      order: items.length,
    };
    updateAgent(agent.id, { ruleItems: [...items, item] });
    setNewContent('');
    toast.success('Rule added');
  };

  const removeItem = (itemId: string) => {
    updateAgent(agent.id, { ruleItems: items.filter(i => i.id !== itemId) });
    toast.success('Rule removed');
  };

  const toggleItem = (itemId: string) => {
    updateAgent(agent.id, { ruleItems: items.map(i => i.id === itemId ? { ...i, enabled: !i.enabled } : i) });
  };

  const priorityBorderColor: Record<RulePriority, string> = {
    safe: 'border-l-[hsl(var(--status-working))]',
    preference: 'border-l-primary',
    'hard-rule': 'border-l-destructive',
  };

  const priorityColor: Record<RulePriority, string> = {
    safe: 'bg-status-working/10 text-status-working',
    preference: 'bg-primary/10 text-primary',
    'hard-rule': 'bg-destructive/10 text-destructive',
  };

  const priorityLabel: Record<RulePriority, string> = {
    safe: 'Safety',
    preference: 'Preference',
    'hard-rule': 'Hard Rule',
  };

  // Group items for section headers
  const groups: { priority: RulePriority; items: typeof sortedItems }[] = [];
  let lastPriority: RulePriority | null = null;
  for (const item of sortedItems) {
    if (item.priority !== lastPriority) {
      groups.push({ priority: item.priority, items: [item] });
      lastPriority = item.priority;
    } else {
      groups[groups.length - 1].items.push(item);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader icon={Shield} title="Rules & Boundaries" desc="Rules are hard limits this agent will always follow" />

      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          Rules give your agent clear boundaries. They're checked before every action.
          Use "Hard Rule" for things that must never be broken, "Safety" for protective defaults, and "Preference" for guidelines.
        </p>
      </div>

      {/* Add new rule */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">Add a rule</p>
        <Textarea
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="e.g. Always ask before sending an email on my behalf"
          className="min-h-[60px] text-sm resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {(['safe', 'preference', 'hard-rule'] as const).map(p => (
              <button
                key={p}
                onClick={() => setNewPriority(p)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                  newPriority === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {priorityLabel[p]}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={addItem} disabled={!newContent.trim()} className="text-xs h-7">
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      </div>

      {/* Rule items grouped by priority */}
      <div className="space-y-4">
        {groups.map(group => (
          <div key={group.priority}>
            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${
              group.priority === 'hard-rule' ? 'text-destructive' : group.priority === 'safe' ? 'text-status-working' : 'text-primary'
            }`}>
              {priorityLabel[group.priority]}s ({group.items.length})
            </p>
            <div className="space-y-1.5">
              {group.items.map(item => (
                <div key={item.id} className={`flex items-start gap-3 p-3 bg-card border border-border border-l-4 ${priorityBorderColor[item.priority]} rounded-xl group transition-opacity ${!item.enabled ? 'opacity-60' : ''}`}>
                  <Switch checked={item.enabled} onCheckedChange={() => toggleItem(item.id)} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{item.content}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1.5 inline-block ${priorityColor[item.priority]}`}>{priorityLabel[item.priority]}</span>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-10 border border-dashed border-border rounded-xl px-6">
            <Shield className="w-8 h-8 mx-auto text-muted-foreground/60 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No rules yet</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              Add rules to keep this agent predictable and safe. Rules are checked before every action.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: 'Safety rule', priority: 'safe' as const, placeholder: 'e.g. Never share personal data with external services' },
                { label: 'Preference', priority: 'preference' as const, placeholder: 'e.g. Prefer shorter responses unless asked for detail' },
                { label: 'Hard limit', priority: 'hard-rule' as const, placeholder: 'e.g. Never send emails without my approval' },
              ].map(chip => (
                <button
                  key={chip.label}
                  onClick={() => { setNewPriority(chip.priority); setNewContent(chip.placeholder); }}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-medium hover:bg-primary/20 transition-colors"
                >
                  + {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════
// TOOLS
// ═══════════════════════════════

const ToolsSection = ({ agent }: { agent: Agent }) => (
  <div className="space-y-6">
    <SectionHeader icon={Wrench} title="Tools & Access" desc="What systems and capabilities this agent can use" />

    {agent.permissions ? (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">What tools it can use</p>
          <div className="flex flex-wrap gap-2">
            {agent.permissions.toolScopes.map(t => (
              <span key={t} className="px-3 py-1 bg-muted rounded-lg text-xs font-medium text-foreground">{t}</span>
            ))}
            {agent.permissions.toolScopes.length === 0 && <p className="text-xs text-muted-foreground italic">No tools configured yet</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">What data it can see</p>
          <div className="flex flex-wrap gap-2">
            {agent.permissions.dataScopes.map(d => (
              <span key={d} className="px-3 py-1 bg-muted rounded-lg text-xs font-medium text-foreground">{d}</span>
            ))}
            {agent.permissions.dataScopes.length === 0 && <p className="text-xs text-muted-foreground italic">No data access configured yet</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-card border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">Internet access</p>
              <p className="text-[10px] text-muted-foreground">Allows this agent to reach websites and external services</p>
            </div>
            <Switch
              checked={agent.permissions.networkAccess}
              onCheckedChange={v => updateAgent(agent.id, { permissions: { ...agent.permissions!, networkAccess: v } })}
            />
          </div>
          <div className="p-3 bg-card border border-border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">Background work</p>
              <p className="text-[10px] text-muted-foreground">This lets the agent keep working without you reopening Homeroom</p>
            </div>
            <Switch
              checked={agent.permissions.backgroundAllowed}
              onCheckedChange={v => updateAgent(agent.id, { permissions: { ...agent.permissions!, backgroundAllowed: v } })}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Needs your OK for</p>
          <div className="flex flex-wrap gap-2">
            {agent.permissions.requiresApprovalFor.map(r => (
              <span key={r} className="px-3 py-1 bg-status-waiting/10 rounded-lg text-xs font-medium text-status-waiting">{r}</span>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-12 border border-dashed border-border rounded-xl px-6">
        <Shield className="w-8 h-8 mx-auto text-muted-foreground/60 mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">No tools or access configured</p>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
          Set up guardrails to control what this agent can do. Start with safe defaults — you can always expand later.
        </p>
        <Button
          size="sm"
          onClick={() => updateAgent(agent.id, {
            permissions: {
              id: `perm-${Date.now()}`, agentId: agent.id,
              safetyLevel: 'moderate', toolScopes: [], dataScopes: [],
              networkAccess: false, requiresApprovalFor: ['all-actions'],
              backgroundAllowed: false,
            }
          })}
        >
          <Shield className="w-3 h-3" /> Apply safe defaults
        </Button>
        <p className="text-[10px] text-muted-foreground mt-2">No internet, no background, approval required for all actions</p>
      </div>
    )}

    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Environment notes</p>
      <p className="text-[10px] text-muted-foreground mb-2">What tools, systems, and conventions does this agent work with?</p>
      <EditableField
        label=""
        value={agent.environmentNotes || ''}
        onSave={v => updateAgent(agent.id, { environmentNotes: v })}
        multiline
        placeholder="e.g. Uses Google Workspace, prefers markdown output, follows our team style guide."
      />
    </div>
  </div>
);

// ═══════════════════════════════
// SCHEDULE
// ═══════════════════════════════

const ScheduleSection = ({ agent }: { agent: Agent }) => {
  const schedulePresets = [
    { label: 'Manual only', value: 'manual', desc: 'Only runs when you ask', badge: 'Safe default' },
    { label: 'Every morning', value: 'daily', desc: 'Runs once a day at 9 AM — good for daily summaries or check-ins', badge: 'Recommended' },
    { label: 'Every hour', value: 'hourly', desc: 'Checks in every hour during work hours — for monitoring tasks', badge: null },
    { label: 'Every weekday', value: 'weekly', desc: 'Runs Monday through Friday — good for recurring reports', badge: null },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon={Clock} title="Schedule" desc="When and how often this agent runs" />

      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div>
          <p className="text-sm font-medium text-foreground">Runs in background</p>
          <p className="text-xs text-muted-foreground">This lets the agent keep working without you reopening Homeroom</p>
        </div>
        <Switch
          checked={agent.backgroundEnabled}
          onCheckedChange={v => updateAgent(agent.id, { backgroundEnabled: v })}
        />
      </div>

      {agent.backgroundEnabled && !agent.permissions && (
        <div className="p-3 bg-status-waiting/10 border border-status-waiting/20 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-status-waiting shrink-0 mt-0.5" />
          <p className="text-xs text-status-waiting">
            This agent runs in the background but has no guardrails. Consider setting up tools & access first.
          </p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-3">Schedule preset</p>
        <div className="space-y-2">
          {schedulePresets.map(p => (
            <button
              key={p.value}
              onClick={() => {
                if (p.value === 'manual') {
                  updateAgent(agent.id, { schedule: null, scheduleSummary: null });
                } else {
                  updateAgent(agent.id, {
                    scheduleSummary: p.desc,
                    schedule: {
                      id: `sched-${Date.now()}`, agentId: agent.id,
                      enabled: true, preset: p.value as any,
                      plainEnglish: p.desc,
                      backendExpression: null,
                      nextRunAt: new Date(Date.now() + 3600000),
                    }
                  });
                }
                toast.success(`Schedule updated: ${p.label}`);
              }}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                (!agent.schedule && p.value === 'manual') || agent.schedule?.preset === p.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                {p.badge && (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${p.badge === 'Recommended' ? 'bg-primary/10 text-primary' : 'bg-status-working/10 text-status-working'}`}>
                    {p.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {agent.schedule && (
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Next run</p>
          </div>
          <p className="text-xs text-muted-foreground">{agent.schedule.plainEnglish}</p>
          {agent.schedule.nextRunAt && (
            <p className="text-xs text-muted-foreground mt-1">Next: {timeAgo(agent.schedule.nextRunAt)}</p>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════
// ACTIVITY
// ═══════════════════════════════

const ActivitySection = ({ agent }: { agent: Agent }) => (
  <div className="space-y-6">
    <SectionHeader icon={Activity} title="Activity" desc="Recent runs and events" />

    <TaskAssigner agent={agent} />

    {/* Run history */}
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-3">Run history</p>
      <div className="space-y-2">
        {agent.runs.slice(0, 20).map(run => (
          <div key={run.id} className="p-3 bg-card border border-border rounded-xl">
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                run.status === 'completed' ? 'bg-status-working' :
                run.status === 'running' ? 'bg-primary animate-pulse' :
                run.status === 'failed' ? 'bg-destructive' : 'bg-muted-foreground'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{run.inputSummary}</p>
                {run.outputSummary && <p className="text-xs text-muted-foreground mt-1">{run.outputSummary}</p>}
                {run.errorSummary && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {run.errorSummary}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <RunBadge status={run.status} />
                  <span className="text-[10px] text-muted-foreground">{timeAgo(run.startedAt)}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{run.trigger}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {agent.runs.length === 0 && (
          <div className="text-center py-10 border border-dashed border-border rounded-xl px-6">
            <Activity className="w-8 h-8 mx-auto text-muted-foreground/60 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No recent runs</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              Run this agent once to see what it can do. Give it a simple task to start.
            </p>
          </div>
        )}
      </div>
    </div>

    {/* Event log */}
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-3">Event log</p>
      <div className="space-y-0.5">
        {agent.activities.slice(0, 20).map(act => (
          <div key={act.id} className="flex gap-3 text-xs py-2 border-b border-border/30 last:border-0">
            <span className="text-muted-foreground whitespace-nowrap w-14 text-right shrink-0">{timeAgo(act.timestamp)}</span>
            <div className="min-w-0">
              <span className="font-medium text-foreground">{act.action}</span>{' '}
              <span className="text-muted-foreground">{act.detail}</span>
            </div>
          </div>
        ))}
        {agent.activities.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
        )}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════
// ADVANCED
// ═══════════════════════════════

const AdvancedSection = ({ agent }: { agent: Agent }) => (
  <div className="space-y-6">
    <SectionHeader icon={Settings} title="Advanced Settings" desc="Power-user controls and raw configuration" />

    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground">
        Most people won't need this section. It gives you direct access to the underlying configuration and OpenClaw document mappings.
      </p>
    </div>

    {/* Runtime */}
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <p className="text-xs font-semibold text-muted-foreground">How smart should it be?</p>
      <p className="text-[10px] text-muted-foreground -mt-2">Higher settings can handle harder tasks, but may cost more or feel slower.</p>
      <div className="space-y-2">
        {([
          { val: 'basic' as SmartLevel, label: 'Quick & Simple', desc: 'For repetitive tasks — sorting, formatting, templates. Fast and cheap.', example: 'Rename files, reformat lists', icon: Zap, badge: null },
          { val: 'standard' as SmartLevel, label: 'Balanced', desc: 'Handles most work — writing, summaries, Q&A, light analysis. Good default.', example: 'Draft a blog post, review a doc', icon: Brain, badge: 'Recommended' },
          { val: 'advanced' as SmartLevel, label: 'Deep Thinker', desc: 'For nuanced reasoning, creativity, and complex analysis. Slowest and most expensive.', example: 'Analyze a contract, debug complex code', icon: Rocket, badge: 'Advanced' },
        ] as const).map(opt => (
          <button key={opt.val} onClick={() => updateAgent(agent.id, { smartnessLevel: opt.val })}
            className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
              agent.smartnessLevel === opt.val ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <opt.icon className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">{opt.label}</span>
              {opt.badge && (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${opt.badge === 'Recommended' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {opt.badge}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground ml-6">{opt.desc}</p>
            <p className="text-[10px] text-muted-foreground/60 ml-6 italic">e.g. {opt.example}</p>
          </button>
        ))}
      </div>
    </div>

    {/* Where it runs */}
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">Where does it run?</p>
      <p className="text-[10px] text-muted-foreground -mt-1">Local: runs on your machine, fully private. Cloud: uses an online AI provider, more powerful.</p>
      <div className="space-y-2">
        {([
          { val: 'local' as RuntimeMode, label: 'On your computer', desc: 'Fully private, works offline. Uses local models.', icon: Cpu, badge: 'Private' },
          { val: 'cloud' as RuntimeMode, label: 'Online (cloud)', desc: 'More powerful models via the internet. Data leaves your machine.', icon: Cloud, badge: null },
          { val: 'hybrid' as RuntimeMode, label: 'Both', desc: 'Local when possible, cloud for complex tasks.', icon: RefreshCw, badge: 'Recommended' },
        ] as const).map(opt => (
          <button key={opt.val} onClick={() => updateAgent(agent.id, { runtimeMode: opt.val })}
            className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
              agent.runtimeMode === opt.val ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <opt.icon className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                {opt.badge && (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${opt.badge === 'Recommended' ? 'bg-primary/10 text-primary' : 'bg-status-working/10 text-status-working'}`}>
                    {opt.badge}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>

    {/* Escalation */}
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">Behavior when stuck</p>
      <Select value={agent.escalationBehavior} onValueChange={(v: EscalationBehavior) => updateAgent(agent.id, { escalationBehavior: v })}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="pause-and-wait" className="text-xs">Pause and wait for you</SelectItem>
          <SelectItem value="retry-once" className="text-xs">Retry once, then pause</SelectItem>
          <SelectItem value="notify-and-continue" className="text-xs">Notify and keep going</SelectItem>
          <SelectItem value="ask-for-help" className="text-xs">Ask for help</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Check-in */}
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">Check-in frequency</p>
      <Select value={agent.checkInFrequency} onValueChange={(v: CheckInFrequency) => updateAgent(agent.id, { checkInFrequency: v })}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="never" className="text-xs">Never</SelectItem>
          <SelectItem value="hourly" className="text-xs">Every hour</SelectItem>
          <SelectItem value="daily" className="text-xs">Once a day</SelectItem>
          <SelectItem value="after-each-task" className="text-xs">After each task</SelectItem>
          <SelectItem value="when-stuck" className="text-xs">Only when stuck</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* OpenClaw doc mappings */}
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <p className="text-xs font-semibold text-muted-foreground">OpenClaw Document Mapping</p>
      <p className="text-[10px] text-muted-foreground">These map to the underlying workspace files that power your agent.</p>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
            <Users className="w-3 h-3" /> Audience <span className="text-muted-foreground/50">· USER.md</span>
          </p>
          <EditableField label="" value={agent.audienceNotes || ''} onSave={v => updateAgent(agent.id, { audienceNotes: v })} multiline placeholder="Who is this agent helping?" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
            <Wrench className="w-3 h-3" /> Environment <span className="text-muted-foreground/50">· TOOLS.md</span>
          </p>
          <EditableField label="" value={agent.environmentNotes || ''} onSave={v => updateAgent(agent.id, { environmentNotes: v })} multiline placeholder="What tools and systems does it use?" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
            <Database className="w-3 h-3" /> Memory <span className="text-muted-foreground/50">· MEMORY.md</span>
          </p>
          <EditableField label="" value={agent.memoryNotes || ''} onSave={v => updateAgent(agent.id, { memoryNotes: v })} multiline placeholder="What should it remember?" />
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════
// SAFETY SUMMARY CARD
// ═══════════════════════════════

const SafetySummaryCard = ({ agent }: { agent: Agent }) => {
  const checks = [
    {
      label: agent.runtimeMode === 'local' ? 'Runs on your device' : agent.runtimeMode === 'cloud' ? 'Uses cloud models' : 'Uses local + cloud models',
      icon: agent.runtimeMode === 'local' ? Cpu : Cloud,
      ok: true,
    },
    {
      label: agent.backgroundEnabled ? 'Runs in background' : 'Manual only',
      icon: agent.backgroundEnabled ? RefreshCw : Play,
      ok: true,
    },
    {
      label: agent.permissions?.networkAccess ? 'Can access the internet' : 'No internet access',
      icon: Shield,
      ok: true,
    },
    {
      label: agent.permissions?.toolScopes?.length
        ? `Can use: ${agent.permissions.toolScopes.slice(0, 3).join(', ')}${agent.permissions.toolScopes.length > 3 ? ` +${agent.permissions.toolScopes.length - 3} more` : ''}`
        : 'No tools configured',
      icon: Wrench,
      ok: true,
    },
    {
      label: !agent.permissions ? 'No guardrails set — consider adding rules' : '',
      icon: AlertTriangle,
      ok: !!agent.permissions,
      warning: !agent.permissions,
    },
  ].filter(c => c.label);

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Safety summary
        </p>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          checks.some(c => c.warning) ? 'bg-status-waiting/10 text-status-waiting' : 'bg-status-working/10 text-status-working'
        }`}>
          {checks.some(c => c.warning) ? 'Needs review' : 'Looking good'}
        </span>
      </div>
      <div className="space-y-1.5">
        {checks.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <Icon className={`w-3 h-3 shrink-0 ${c.warning ? 'text-status-waiting' : 'text-muted-foreground'}`} />
              <span className={c.warning ? 'text-status-waiting' : 'text-foreground'}>{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════
// Shared sub-components
// ═══════════════════════════════

const SectionHeader = ({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) => (
  <div className="flex items-center gap-3 mb-2">
    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
      <Icon className="w-4.5 h-4.5 text-primary" />
    </div>
    <div>
      <h2 className="font-display font-bold text-lg text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  </div>
);

const EditableField = ({ label, value, onSave, multiline, placeholder, tall }: {
  label: string; value: string; onSave: (v: string) => void; multiline?: boolean; placeholder?: string; tall?: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const save = () => {
    if (draft.trim() !== value) {
      onSave(draft.trim());
      if (label) toast.success(`Updated`);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-1">
        {label && <p className="text-xs text-muted-foreground font-medium">{label}</p>}
        {multiline ? (
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} className={`text-sm resize-none ${tall ? 'min-h-[160px]' : 'min-h-[60px]'}`} autoFocus onBlur={save} placeholder={placeholder} />
        ) : (
          <Input value={draft} onChange={e => setDraft(e.target.value)} className="text-sm" autoFocus onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} placeholder={placeholder} />
        )}
      </div>
    );
  }

  return (
    <div className="group cursor-pointer rounded-lg px-2 py-1.5 -mx-2 hover:bg-muted/50 transition-colors" onClick={() => setEditing(true)}>
      {label && <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground whitespace-pre-wrap">{value || <span className="text-muted-foreground italic">{placeholder || 'Click to edit'}</span>}</p>
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
      </div>
    </div>
  );
};

const TaskAssigner = ({ agent }: { agent: Agent }) => {
  const [input, setInput] = useState('');

  const assign = () => {
    if (!input.trim()) return;
    updateAgent(agent.id, {
      currentTask: input.trim(), state: 'working', zone: 'work',
      lastRunAt: new Date(), lastRunStatus: 'running',
      activities: [
        { id: `act-${Date.now()}`, timestamp: new Date(), action: 'Task Assigned', detail: input.trim() },
        ...agent.activities,
      ],
      runs: [
        { id: `run-${Date.now()}`, agentId: agent.id, trigger: 'manual', status: 'running', startedAt: new Date(), finishedAt: null, inputSummary: input.trim(), outputSummary: null, errorSummary: null, backendRef: null },
        ...agent.runs,
      ],
    });
    setInput('');
    toast.success(`Task assigned to ${agent.name}`);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Run now</p>
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={`What should ${agent.name} work on?`} className="min-h-[60px] text-sm resize-none" />
      <Button size="sm" className="w-full mt-2 text-xs" disabled={!input.trim()} onClick={assign}>
        <Play className="w-3 h-3" /> Assign & run
      </Button>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-center p-3 bg-card border border-border rounded-xl">
    <p className="text-xl font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

const RunBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    completed: 'bg-status-working/10 text-status-working',
    running: 'bg-primary/10 text-primary',
    failed: 'bg-destructive/10 text-destructive',
    pending: 'bg-muted text-muted-foreground',
  };
  const labels: Record<string, string> = {
    completed: 'Success',
    running: 'Running',
    failed: 'Failed',
    pending: 'Pending',
    cancelled: 'Cancelled',
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      {labels[status] || status}
    </span>
  );
};

export default AgentProfilePage;
