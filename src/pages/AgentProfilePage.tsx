import React, { useState, useEffect } from 'react';
import AvatarPreview from '@/components/AvatarPreview';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgents, updateAgent, removeAgent } from '@/store/agentStore';
import { useAgent, useAgentRuns, useRunAgent, useUpdateAgent, useDeleteAgent } from '@/hooks/api/useAgents';
import {
  ArrowLeft, User, FileText, Shield, Clock,
  Play, Pause, Trash2, Cpu, Cloud, Zap,
  AlertTriangle, Pencil, Check, Plus, X,
  RefreshCw, Copy, CheckCircle2, XCircle,
  Calendar, FolderOpen, BookMarked, Terminal, GitBranch, FileCode, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Agent, AgentState, OfficeZone, STATE_LABELS,
  RulePriority,
  AgentAppearance,
} from '@/types/agent';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

// Soft background variant for pills/chips. Kept as full literal class names so
// Tailwind's JIT can statically detect them — interpolating like `${stateColor}/10`
// silently produces no background.
const stateSoftBg = (state: string) => {
  switch (state) {
    case 'working': return 'bg-status-working/10 text-status-working';
    case 'on-break': return 'bg-status-break/10 text-status-break';
    case 'waiting': case 'needs-attention': return 'bg-status-waiting/10 text-status-waiting';
    case 'sleeping': case 'offline': return 'bg-status-offline/10 text-muted-foreground';
    default: return 'bg-status-idle/10 text-muted-foreground';
  }
};

// ── Section navigation ──

const SECTIONS = [
  { id: 'profile',    label: 'Profile',    icon: User,        desc: 'Who this agent is' },
  { id: 'brief',      label: 'Brief',      icon: FileText,    desc: 'AGENTS.md & related docs' },
  { id: 'rules',      label: 'Rules',      icon: Shield,      desc: 'What it can do' },
  { id: 'schedule',   label: 'Schedule',   icon: Clock,       desc: 'When it runs' },
  { id: 'trail',      label: 'Trail',      icon: Terminal,    desc: 'Behind the scenes' },
  { id: 'workspace',  label: 'Workspace',  icon: FolderOpen,  desc: 'Files & Obsidian' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// ── Remove Agent Button (type-to-confirm) ──

const RemoveAgentButton = ({ agent, onRemove }: { agent: Agent; onRemove: () => void }) => {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const confirmed = typed.trim().toLowerCase() === agent.name.trim().toLowerCase();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-[11px] text-muted-foreground/50 hover:text-destructive transition-colors py-1 flex items-center justify-center gap-1.5"
      >
        <Trash2 className="w-3 h-3" /> Remove from office
      </button>

      <AlertDialog open={open} onOpenChange={o => { setOpen(o); if (!o) setTyped(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Remove {agent.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                This permanently removes <strong>{agent.name}</strong> from your office — including all memory, rules, run history, and configuration. There is no undo.
              </span>
              <span className="block pt-1">
                Type <strong className="text-foreground font-mono">{agent.name}</strong> to confirm:
              </span>
              <input
                autoFocus
                value={typed}
                onChange={e => setTyped(e.target.value)}
                placeholder={agent.name}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background font-mono focus:outline-none focus:ring-2 focus:ring-destructive/30"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTyped('')}>Cancel</AlertDialogCancel>
            <Button
              disabled={!confirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => { if (confirmed) { setOpen(false); onRemove(); } }}
            >
              Remove permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ── Main Component ──

const AgentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Prefer detail from backend; fall back to store for immediate render
  const { data: agentDetail, isLoading: detailLoading } = useAgent(id ?? '');
  const storeAgents = useAgents();
  const storeAgent = storeAgents.find(a => a.id === id);
  const agent = agentDetail ?? storeAgent;

  const updateAgentMutation = useUpdateAgent(id ?? '');
  const deleteAgentMutation = useDeleteAgent();

  const [section, setSection] = useState<SectionId>('profile');
  const taskAssignerRef = React.useRef<HTMLTextAreaElement>(null);

  // Real run data from backend
  const { data: backendRuns = [] } = useAgentRuns(id ?? '');
  const runAgent = useRunAgent(id ?? '');
  const runs = React.useMemo(() =>
    backendRuns.map(r => ({
      ...r,
      startedAt:     new Date(r.startedAt),
      finishedAt:    r.finishedAt ? new Date(r.finishedAt) : null,
      outputSummary: r.outputSummary || null,
    })),
    [backendRuns],
  );

  if (detailLoading && !storeAgent) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

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
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stateSoftBg(agent.state)}`}>
              {STATE_LABELS[agent.state]}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              {agent.runtimeMode === 'local' ? <><Cpu className="w-3 h-3" /> Local</> : <><Cloud className="w-3 h-3" /> Cloud</>}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                  section === s.id
                    ? 'text-primary bg-primary/5 border-r-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="leading-none">{s.label}</p>
                  <p className="text-[9px] font-normal text-muted-foreground/70 mt-0.5 truncate">{s.desc}</p>
                </div>
                {s.id === 'trail' && runs.length > 0 && (
                  <span className="ml-auto text-[9px] bg-primary/10 text-primary rounded-full px-1.5">{runs.length}</span>
                )}
                {s.id === 'workspace' && !agent.workspacePath && (
                  <span className="ml-auto text-[9px] bg-status-waiting/10 text-status-waiting rounded-full px-1.5">setup</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action buttons - always visible */}
        <div className="p-3 border-t border-border space-y-1 shrink-0">
          <Button size="sm" className="w-full text-xs h-7" onClick={() => {
            setSection('profile');
            setTimeout(() => taskAssignerRef.current?.focus(), 50);
          }}>
            <Play className="w-3 h-3" /> Run Now
          </Button>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setSection('schedule')}>
              <Calendar className="w-3 h-3" /> Schedule
            </Button>
            {isActive ? (
              <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => handleSetState('paused')}>
                <Pause className="w-3 h-3" /> Pause
              </Button>
            ) : agent.state === 'paused' ? (
              <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => handleSetState('working')}>
                <Play className="w-3 h-3" /> Resume
              </Button>
            ) : null}
          </div>
          <div className="pt-2 mt-1 border-t border-border/50">
            <RemoveAgentButton agent={agent} onRemove={() => {
              deleteAgentMutation.mutate(agent.id, { onSuccess: () => navigate('/agents') });
              removeAgent(agent.id); // keep store in sync immediately
            }} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
        {section === 'profile'    && <ProfileSection agent={agent} onSetState={handleSetState} taskAssignerRef={taskAssignerRef} runs={runs} onRun={v => runAgent.mutate(v)} />}
        {section === 'brief'      && <BriefSection agent={agent} />}
        {section === 'rules'      && <RulesAndAccessSection agent={agent} />}
        {section === 'schedule'   && <ScheduleSection agent={agent} />}
        {section === 'trail'      && <TrailSection agent={agent} runs={runs} />}
        {section === 'workspace'  && <WorkspaceSection agent={agent} />}
      </div>
    </div>
  );
};

// ═══════════════════════════════
// PROFILE
// ═══════════════════════════════

type MappedRun = { id: string; agentId: string; trigger: string; status: string; startedAt: Date; finishedAt: Date | null; inputSummary: string; outputSummary: string | null; errorSummary: string | null; backendRef?: string | null };

const ProfileSection = ({ agent, onSetState, taskAssignerRef, runs = [], onRun }: { agent: Agent; onSetState: (s: AgentState) => void; taskAssignerRef?: React.RefObject<HTMLTextAreaElement>; runs?: MappedRun[]; onRun?: (input: string) => void }) => {
  const isActive = agent.state === 'working' || agent.state === 'walking';

  return (
    <div className="space-y-6">
      <SectionHeader icon={User} title="Profile" desc="At a glance" />

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
      <TaskAssigner agent={agent} textareaRef={taskAssignerRef} onRun={onRun} />

      {/* Last result */}
      {runs.length > 0 && (
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Last result</p>
          <p className="text-sm text-foreground">{runs[0].outputSummary || runs[0].inputSummary}</p>
          <div className="flex items-center gap-2 mt-2">
            <RunBadge status={runs[0].status} />
            <span className="text-xs text-muted-foreground">{timeAgo(runs[0].startedAt)}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total runs" value={runs.length} />
        <StatCard label="Completed" value={runs.filter(r => r.status === 'completed').length} />
        <StatCard label="Last run" value={runs[0] ? timeAgo(runs[0].startedAt) : (agent.lastRunAt ? timeAgo(agent.lastRunAt) : 'Never')} />
      </div>

      {/* Pending approvals for this agent */}
      <PendingApprovalsCard agent={agent} />

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

// ─── Appearance constants & helpers (used by BriefSection) ───

const SKIN_TONES = ['#FDDBB4', '#F1C27D', '#D2A679', '#8D5524', '#6B3A2A', '#3B1F0B'];
const HAIR_COLORS = ['#1A1A1A', '#3B2716', '#A0522D', '#D4A44C', '#C0392B', '#8E44AD', '#F5F5DC'];
const OUTFIT_COLORS = ['#5B8C5A', '#C06030', '#4A6FA5', '#9B59B6', '#2C3E50', '#E67E22', '#E74C3C', '#1ABC9C', '#F39C12', '#34495E'];
const BODY_TYPE_OPTIONS: AgentAppearance['bodyType'][] = ['masculine', 'feminine'];
const HAIR_STYLE_OPTIONS: AgentAppearance['hairStyle'][] = ['short', 'long', 'curly', 'buzz', 'ponytail', 'bun', 'mohawk', 'braids', 'wavy', 'afro', 'shaved'];
const OUTFIT_STYLE_OPTIONS: AgentAppearance['outfitStyle'][] = ['casual', 'formal', 'sporty', 'techy', 'creative', 'cozy'];
const GLASSES_OPTIONS: AgentAppearance['glasses'][] = ['none', 'round', 'square', 'aviator'];
const HEADWEAR_OPTIONS: AgentAppearance['headwear'][] = ['none', 'cap', 'beanie', 'headband', 'beret'];

const ColorRow = ({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (c: string) => void }) => (
  <div>
    <p className="text-[10px] font-medium text-muted-foreground mb-1">{label}</p>
    <div className="flex gap-1.5 flex-wrap">
      {colors.map(c => (
        <button key={c} onClick={() => onChange(c)} className={`w-6 h-6 rounded-full border-2 transition-all ${value === c ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} aria-label={`${label} ${c}`} />
      ))}
    </div>
  </div>
);

function ChipRow<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
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
}

// ═══════════════════════════════
// BRIEF — AGENTS.md + companion docs
// ═══════════════════════════════

const DocFileLabel = ({ file, desc }: { file: string; desc: string }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{file}</span>
    <span className="text-[10px] text-muted-foreground">{desc}</span>
  </div>
);

const BriefSection = ({ agent }: { agent: Agent }) => {
  const app = agent.appearance;
  const setApp = (updates: Partial<AgentAppearance>) => updateAgent(agent.id, { appearance: { ...app, ...updates } });

  return (
    <div className="space-y-6">
      <SectionHeader icon={FileText} title="Brief" desc="What this agent knows, how it sounds, and what to remember" />

      {/* AGENTS.md */}
      <div className="space-y-3">
        <DocFileLabel file="AGENTS.md" desc="Read before every task" />
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">Role</p>
            <EditableField label="" value={agent.role} onSave={v => updateAgent(agent.id, { role: v })} placeholder="What this agent does in one sentence" />
          </div>
          <div className="border-t border-border/50 pt-4">
            <p className="text-xs font-semibold text-foreground mb-1">Instructions</p>
            <p className="text-[10px] text-muted-foreground mb-2">What the agent does on every task</p>
            <EditableField label="" value={agent.instructions} onSave={v => updateAgent(agent.id, { instructions: v })} multiline tall placeholder="e.g. When asked to research something, find at least 3 sources. Always include links. Present findings as bullet points." />
          </div>
          <div className="border-t border-border/50 pt-4">
            <p className="text-xs font-semibold text-foreground mb-1">Personality</p>
            <p className="text-[10px] text-muted-foreground mb-2">What you write here is what this agent becomes — the more specific, the better.</p>
            <EditableField label="" value={agent.personality} onSave={v => updateAgent(agent.id, { personality: v })} multiline tall placeholder="Describe how this agent talks, thinks, and behaves. Be as specific as you want — things like 'never uses bullet points', 'always asks a clarifying question before starting', or 'speaks casually but is precise about details' all count." />
          </div>
        </div>
      </div>

      {/* USER.md */}
      <div className="space-y-3">
        <DocFileLabel file="USER.md" desc="Who this agent is helping" />
        <div className="bg-card border border-border rounded-xl p-4">
          <EditableField label="" value={agent.audienceNotes || ''} onSave={v => updateAgent(agent.id, { audienceNotes: v })} multiline placeholder="e.g. A solo founder shipping a side project. Prefers bullet-point summaries, works in Pacific time." />
        </div>
      </div>

      {/* TOOLS.md */}
      <div className="space-y-3">
        <DocFileLabel file="TOOLS.md" desc="What tools and systems are available" />
        <div className="bg-card border border-border rounded-xl p-4">
          <EditableField label="" value={agent.environmentNotes || ''} onSave={v => updateAgent(agent.id, { environmentNotes: v })} multiline placeholder="e.g. Uses Google Workspace. Has access to GitHub via the gh CLI. Prefers markdown output." />
        </div>
      </div>

      {/* MEMORY.md */}
      <div className="space-y-3">
        <DocFileLabel file="MEMORY.md" desc="What the agent should remember between runs" />
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <EditableField label="" value={agent.memoryNotes || ''} onSave={v => updateAgent(agent.id, { memoryNotes: v })} multiline placeholder="Free-form notes the agent should carry forward..." />

          {/* Structured memory items */}
          {(agent.memoryItems || []).length > 0 && (
            <div className="border-t border-border/50 pt-3 space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground mb-2">Pinned items</p>
              {[...agent.memoryItems].sort((a, b) => Number(b.pinned) - Number(a.pinned)).slice(0, 5).map(item => (
                <div key={item.id} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${item.pinned ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                  <p className="text-foreground">{item.content}</p>
                  <span className="ml-auto text-[9px] text-muted-foreground capitalize shrink-0">{item.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">Appearance</p>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex gap-4">
            <div className="shrink-0">
              <AvatarPreview appearance={app} name={agent.name} size={100} />
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[40vh] pr-1">
              <ChipRow label="Body type" options={BODY_TYPE_OPTIONS} value={app.bodyType || 'masculine'} onChange={v => setApp({ bodyType: v })} />
              <ColorRow label="Skin tone" colors={SKIN_TONES} value={app.skinTone} onChange={c => setApp({ skinTone: c })} />
              <ChipRow label="Hair style" options={HAIR_STYLE_OPTIONS} value={app.hairStyle} onChange={v => setApp({ hairStyle: v })} />
              <ColorRow label="Hair color" colors={HAIR_COLORS} value={app.hairColor} onChange={c => setApp({ hairColor: c })} />
              <ChipRow label="Outfit style" options={OUTFIT_STYLE_OPTIONS} value={app.outfitStyle} onChange={v => setApp({ outfitStyle: v })} />
              <ColorRow label="Outfit color" colors={OUTFIT_COLORS} value={app.outfitColor} onChange={c => setApp({ outfitColor: c })} />
              <ChipRow label="Glasses" options={GLASSES_OPTIONS} value={app.glasses} onChange={v => setApp({ glasses: v })} />
              <ChipRow label="Headwear" options={HEADWEAR_OPTIONS} value={app.headwear} onChange={v => setApp({ headwear: v })} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 rounded-lg border border-border">
        <RefreshCw className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          Changes here sync to <span className="font-mono font-medium text-foreground">AGENTS.md</span> in your workspace automatically.
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════
// RULES & ACCESS
// ═══════════════════════════════

const ACCESS_ITEMS = [
  { id: 'web', label: 'Can search the web', desc: 'Lets the agent fetch URLs and search online', icon: Globe },
  { id: 'files', label: 'Can read & write files', desc: 'Access to your workspace folder on disk', icon: FolderOpen },
  { id: 'email', label: 'Can send emails', desc: 'Requires your approval for each email by default', icon: FileText },
  { id: 'background', label: 'Runs without you open', desc: 'Agent can work on its schedule in the background', icon: RefreshCw },
] as const;

const RulesAndAccessSection = ({ agent }: { agent: Agent }) => {
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<RulePriority>('preference');
  const items = agent.ruleItems || [];

  const priorityOrder: Record<RulePriority, number> = { 'hard-rule': 0, safe: 1, preference: 2 };
  const sortedItems = [...items].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || (a.order ?? 0) - (b.order ?? 0));

  const addItem = () => {
    if (!newContent.trim()) return;
    updateAgent(agent.id, { ruleItems: [...items, { id: `rule-${Date.now()}`, content: newContent.trim(), priority: newPriority, enabled: true, order: items.length }] });
    setNewContent('');
    toast.success('Rule added');
  };

  const toggleItem = (itemId: string) => {
    updateAgent(agent.id, { ruleItems: items.map(i => i.id === itemId ? { ...i, enabled: !i.enabled } : i) });
  };

  const removeItem = (itemId: string) => {
    updateAgent(agent.id, { ruleItems: items.filter(i => i.id !== itemId) });
  };

  const priorityColor: Record<RulePriority, string> = {
    safe: 'text-status-working',
    preference: 'text-primary',
    'hard-rule': 'text-destructive',
  };

  const priorityLabel: Record<RulePriority, string> = { safe: 'Safety', preference: 'Preference', 'hard-rule': 'Hard Rule' };
  const priorityLeftBorder: Record<RulePriority, string> = { safe: 'border-l-[hsl(var(--status-working))]', preference: 'border-l-primary', 'hard-rule': 'border-l-destructive' };

  return (
    <div className="space-y-6">
      <SectionHeader icon={Shield} title="Rules & Access" desc="What this agent can do and what it should never do" />

      {/* Access toggles */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Capabilities</p>
        {ACCESS_ITEMS.map(item => {
          const Icon = item.icon;
          const isOn = item.id === 'web' ? agent.permissions?.networkAccess :
                       item.id === 'background' ? agent.backgroundEnabled :
                       item.id === 'files' ? (agent.permissions?.dataScopes?.length ?? 0) > 0 :
                       item.id === 'email' ? (agent.permissions?.requiresApprovalFor?.includes('email') === false) : false;
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={!!isOn}
                onCheckedChange={v => {
                  if (item.id === 'web') {
                    const p = agent.permissions ?? { id: `perm-${Date.now()}`, agentId: agent.id, safetyLevel: 'moderate' as const, toolScopes: [], dataScopes: [], networkAccess: false, requiresApprovalFor: [], backgroundAllowed: false };
                    updateAgent(agent.id, { permissions: { ...p, networkAccess: v } });
                  } else if (item.id === 'background') {
                    updateAgent(agent.id, { backgroundEnabled: v });
                  } else if (item.id === 'files') {
                    const p = agent.permissions ?? { id: `perm-${Date.now()}`, agentId: agent.id, safetyLevel: 'moderate' as const, toolScopes: [], dataScopes: [], networkAccess: false, requiresApprovalFor: [], backgroundAllowed: false };
                    updateAgent(agent.id, { permissions: { ...p, dataScopes: v ? ['workspace'] : [] } });
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Escalation */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">When it gets stuck</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { val: 'pause-and-wait', label: 'Pause & wait', desc: 'Safest' },
            { val: 'retry-once', label: 'Retry once', desc: 'Then pauses' },
            { val: 'notify-and-continue', label: 'Notify & continue', desc: 'Best effort' },
            { val: 'ask-for-help', label: 'Ask for help', desc: 'Interactive' },
          ] as const).map(opt => (
            <button key={opt.val} onClick={() => updateAgent(agent.id, { escalationBehavior: opt.val })}
              className={`p-2.5 rounded-xl border-2 text-left text-xs transition-all ${agent.escalationBehavior === opt.val ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
            >
              <p className="font-medium text-foreground">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Hard rules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">Hard rules</p>
          <span className="text-[10px] text-muted-foreground">{items.length} rule{items.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Add rule */}
        <div className="bg-card border border-border rounded-xl p-3 space-y-2">
          <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="e.g. Never send emails without my approval" className="min-h-[52px] text-sm resize-none" />
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(['safe', 'preference', 'hard-rule'] as const).map(p => (
                <button key={p} onClick={() => setNewPriority(p)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${newPriority === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >{priorityLabel[p]}</button>
              ))}
            </div>
            <Button size="sm" onClick={addItem} disabled={!newContent.trim()} className="text-xs h-7">
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </div>

        {/* Rule list */}
        <div className="space-y-1.5">
          {sortedItems.map(item => (
            <div key={item.id} className={`flex items-start gap-3 p-3 bg-card border border-border border-l-4 ${priorityLeftBorder[item.priority]} rounded-xl group ${!item.enabled ? 'opacity-50' : ''}`}>
              <Switch checked={item.enabled} onCheckedChange={() => toggleItem(item.id)} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${item.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{item.content}</p>
                <span className={`text-[10px] font-medium ${priorityColor[item.priority]}`}>{priorityLabel[item.priority]}</span>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive opacity-30 group-hover:opacity-100 transition-opacity p-1 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <Shield className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No rules yet — they'll be checked before every action.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════
// SCHEDULE
// ═══════════════════════════════

const ScheduleSection = ({ agent }: { agent: Agent }) => {
  const [task, setTask] = useState(agent.currentTask || '');
  const presets = [
    { value: null,      label: 'Manual only',     desc: 'Only runs when you ask' },
    { value: 'daily',   label: 'Every morning',   desc: 'Once a day at 9 AM' },
    { value: 'hourly',  label: 'Every hour',      desc: 'During work hours' },
    { value: 'weekly',  label: 'Every weekday',   desc: 'Monday–Friday' },
    { value: 'custom',  label: 'Custom',          desc: 'Set your own schedule' },
  ] as const;

  const activePreset = agent.schedule?.preset ?? null;

  const save = () => {
    if (activePreset === null) {
      updateAgent(agent.id, { schedule: null, scheduleSummary: null });
    } else {
      const p = presets.find(p => p.value === activePreset);
      updateAgent(agent.id, {
        scheduleSummary: p?.desc ?? null,
        schedule: {
          id: agent.schedule?.id ?? `sched-${Date.now()}`,
          agentId: agent.id,
          enabled: true,
          preset: activePreset,
          plainEnglish: p?.desc ?? '',
          backendExpression: null,
          nextRunAt: new Date(Date.now() + 3600000),
        },
      });
    }
    if (task.trim()) updateAgent(agent.id, { currentTask: task.trim() });
    toast.success('Schedule saved');
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={Clock} title="Schedule" desc="What this agent does on its own and when" />

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-foreground">What should it do?</p>
        <Textarea
          value={task}
          onChange={e => setTask(e.target.value)}
          placeholder={`e.g. Check my inbox for anything urgent and summarise it`}
          className="min-h-[72px] text-sm resize-none"
        />
        <p className="text-[10px] text-muted-foreground">This is the standing task the agent runs on schedule. You can override it any time from the Run Now box.</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">How often?</p>
        {presets.map(p => (
          <button
            key={String(p.value)}
            onClick={() => updateAgent(agent.id, {
              schedule: p.value === null ? null : {
                id: agent.schedule?.id ?? `sched-${Date.now()}`,
                agentId: agent.id,
                enabled: true,
                preset: p.value,
                plainEnglish: p.desc,
                backendExpression: null,
                nextRunAt: new Date(Date.now() + 3600000),
              },
              scheduleSummary: p.value === null ? null : p.desc,
            })}
            className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
              activePreset === p.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${activePreset === p.value ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`} />
            <div>
              <p className="text-xs font-medium text-foreground">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">{p.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
        <div>
          <p className="text-xs font-medium text-foreground">Runs in background</p>
          <p className="text-[10px] text-muted-foreground">Keeps working without Homeroom open</p>
        </div>
        <Switch checked={agent.backgroundEnabled} onCheckedChange={v => updateAgent(agent.id, { backgroundEnabled: v })} />
      </div>

      {agent.schedule && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 rounded-lg border border-border">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Next run: <span className="font-medium text-foreground">{agent.schedule.nextRunAt ? timeAgo(agent.schedule.nextRunAt) : 'TBD'}</span> · {agent.schedule.plainEnglish}
          </p>
        </div>
      )}

      {/* Intelligence level */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-foreground">Intelligence</p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Controls which AI model powers this agent. Higher intelligence means better reasoning and longer tasks, but costs more per run.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'basic',    label: 'Basic',    desc: 'Fast & cheap. Good for simple, repetitive tasks.' },
            { value: 'standard', label: 'Standard', desc: 'Balanced. Handles most tasks well.' },
            { value: 'advanced', label: 'Advanced', desc: 'Best reasoning. Use for complex or high-stakes tasks.' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => updateAgent(agent.id, { smartnessLevel: opt.value })}
              className={`p-2.5 rounded-xl border-2 text-left text-xs transition-all ${
                agent.smartnessLevel === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <p className="font-semibold text-foreground mb-0.5">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full" onClick={save}>
        <Check className="w-3.5 h-3.5" /> Save & activate
      </Button>
    </div>
  );
};

// ═══════════════════════════════
// TRAIL — behind the scenes
// ═══════════════════════════════

const TrailSection = ({ agent, runs = [] }: { agent: Agent; runs?: MappedRun[] }) => (
  <div className="space-y-6">
    <SectionHeader icon={Terminal} title="Trail" desc="Everything this agent has done behind the scenes" />

    {/* Run history */}
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">Run history</p>
      {runs.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl px-6">
          <Terminal className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No runs yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">Once this agent runs, you'll see the full trail here — file writes, CLI calls, and output.</p>
        </div>
      ) : (
        runs.slice(0, 20).map(run => (
          <div key={run.id} className="p-3 bg-card border border-border rounded-xl">
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                run.status === 'completed' ? 'bg-status-working' :
                run.status === 'running' ? 'bg-primary animate-pulse' :
                run.status === 'failed' ? 'bg-destructive' : 'bg-muted-foreground'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{run.inputSummary}</p>
                {run.outputSummary && (
                  <div className="mt-2 px-2.5 py-2 bg-muted/60 rounded-lg border border-border/50 font-mono text-[10px] text-foreground whitespace-pre-wrap">
                    {run.outputSummary}
                  </div>
                )}
                {run.errorSummary && (
                  <p className="text-[11px] text-destructive mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {run.errorSummary}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <RunBadge status={run.status} />
                  <span className="text-[10px] text-muted-foreground">{timeAgo(run.startedAt)}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{run.trigger}</span>
                  {run.backendRef && (
                    <span className="text-[10px] text-muted-foreground font-mono opacity-60">{run.backendRef}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>

    {/* Event log */}
    {agent.activities.length > 0 && (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Event log</p>
        <div className="bg-card border border-border rounded-xl divide-y divide-border/30">
          {agent.activities.slice(0, 30).map(act => (
            <div key={act.id} className="flex gap-3 text-xs py-2.5 px-3">
              <span className="text-muted-foreground whitespace-nowrap w-14 text-right shrink-0">{timeAgo(act.timestamp)}</span>
              <div className="min-w-0">
                <span className="font-medium text-foreground">{act.action}</span>{' '}
                <span className="text-muted-foreground">{act.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// ═══════════════════════════════
// WORKSPACE — files & Obsidian
// ═══════════════════════════════

const WorkspaceSection = ({ agent }: { agent: Agent }) => {
  const [editingPath, setEditingPath] = useState(false);
  const [pathDraft, setPathDraft] = useState(agent.workspacePath ?? '');
  const [editingVault, setEditingVault] = useState(false);
  const [vaultDraft, setVaultDraft] = useState(agent.obsidianVaultPath ?? '');

  const workspaceFiles = ['AGENTS.md', 'USER.md', 'TOOLS.md', 'MEMORY.md'];

  const fileDesc: Record<string, string> = {
    'AGENTS.md': 'Role, instructions, personality',
    'USER.md':   'Who the agent is helping',
    'TOOLS.md':  'Available tools and environment',
    'MEMORY.md': 'What to remember between runs',
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={FolderOpen} title="Workspace" desc="Where this agent lives on disk" />

      {!agent.workspacePath ? (
        <div className="text-center py-10 border border-dashed border-status-waiting/40 bg-status-waiting/5 rounded-xl px-6">
          <FolderOpen className="w-8 h-8 mx-auto text-status-waiting/60 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No workspace set up yet</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
            A workspace is a folder on your computer where this agent's documents live. It's what OpenClaw reads before every task.
          </p>
          <Button size="sm" onClick={() => {
            const path = `~/homeroom-workspaces/${agent.name.toLowerCase().replace(/\s+/g, '-')}`;
            updateAgent(agent.id, { workspacePath: path });
            toast.success('Workspace created');
          }}>
            <FolderOpen className="w-3.5 h-3.5" /> Create workspace
          </Button>
        </div>
      ) : (
        <>
          {/* Workspace path */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Workspace folder</p>
              <button onClick={() => setEditingPath(true)} className="text-[10px] text-muted-foreground hover:text-foreground">Change</button>
            </div>
            {editingPath ? (
              <div className="space-y-2">
                <Input value={pathDraft} onChange={e => setPathDraft(e.target.value)} className="text-xs font-mono" autoFocus onKeyDown={e => { if (e.key === 'Enter') { updateAgent(agent.id, { workspacePath: pathDraft }); setEditingPath(false); toast.success('Path updated'); } if (e.key === 'Escape') setEditingPath(false); }} />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={() => { updateAgent(agent.id, { workspacePath: pathDraft }); setEditingPath(false); toast.success('Path updated'); }}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingPath(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-muted-foreground bg-muted px-3 py-2 rounded-lg">{agent.workspacePath}</p>
            )}

            {/* File list */}
            <div className="border-t border-border/50 pt-3 space-y-1">
              {workspaceFiles.map(file => (
                <div key={file} className="flex items-center gap-3 py-1.5 group">
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs text-foreground">{file}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{fileDesc[file]}</span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground hover:text-foreground">Open</button>
                </div>
              ))}
            </div>
          </div>

          {/* Obsidian vault */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Obsidian vault</p>
              {agent.obsidianVaultPath && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-status-working/10 text-status-working ml-auto">Connected</span>
              )}
            </div>

            {agent.obsidianVaultPath ? (
              <>
                <p className="text-xs font-mono text-muted-foreground bg-muted px-3 py-2 rounded-lg">{agent.obsidianVaultPath}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => toast.success('Opening in Obsidian…')}>
                    <BookMarked className="w-3 h-3" /> Open in Obsidian
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-8 text-muted-foreground" onClick={() => { updateAgent(agent.id, { obsidianVaultPath: null }); toast.success('Vault unlinked'); }}>
                    Unlink
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">Link an Obsidian vault to edit this agent's docs with your normal notes workflow.</p>
                {editingVault ? (
                  <div className="space-y-2">
                    <Input value={vaultDraft} onChange={e => setVaultDraft(e.target.value)} placeholder="~/Documents/MyVault" className="text-xs font-mono" autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => { updateAgent(agent.id, { obsidianVaultPath: vaultDraft }); setEditingVault(false); toast.success('Vault linked'); }}>Link vault</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingVault(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setEditingVault(true)}>
                    <BookMarked className="w-3 h-3" /> Link Obsidian vault
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* OpenClaw note */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-muted/40 rounded-lg border border-border">
            <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground">
              This workspace is what OpenClaw reads on disk. Every edit you make in Homeroom syncs here — and vice versa.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════
// Shared sub-components
// ═══════════════════════════════

const SectionHeader = ({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) => (
  <div className="flex items-center gap-3 mb-2">
    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
      <Icon className="w-[18px] h-[18px] text-primary" />
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

const TaskAssigner = ({ agent, textareaRef, onRun }: { agent: Agent; textareaRef?: React.RefObject<HTMLTextAreaElement>; onRun?: (input: string) => void }) => {
  const [input, setInput] = useState('');

  const assign = () => {
    if (!input.trim()) return;
    if (onRun) {
      onRun(input.trim());
    } else {
      // Fallback: local store update (demo / offline mode)
      updateAgent(agent.id, {
        currentTask: input.trim(), state: 'working', zone: 'work',
        lastRunAt: new Date(), lastRunStatus: 'running',
      });
      toast.success(`Task assigned to ${agent.name}`);
    }
    setInput('');
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Run now</p>
      <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} placeholder={`What should ${agent.name} work on?`} className="min-h-[60px] text-sm resize-none" onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) assign(); }} />
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
