import React from 'react';
import { useAgents } from '@/store/agentStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { isModelConfigured } from '@/store/modelConfigStore';
import { hasProviderKey } from '@/store/modelConfigStore';
import { PROVIDER_INFO } from '@/data/models';
import {
  Plus, Play, AlertTriangle, Users, Zap, Clock, CheckCircle2,
  ArrowRight, Cpu, Cloud, Sparkles, Activity, Shield, Key,
  BookOpen, Eye, Settings, Brain, ChevronRight, Pause,
} from 'lucide-react';

// ── Helpers ──

const timeAgo = (date: Date) => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const stateLabel = (state: string) => {
  switch (state) {
    case 'working': return 'Working';
    case 'walking': return 'Working';
    case 'on-break': return 'On break';
    case 'waiting': return 'Waiting';
    case 'needs-attention': return 'Needs attention';
    case 'paused': return 'Paused';
    case 'sleeping': return 'Sleeping';
    case 'offline': return 'Offline';
    default: return 'Idle';
  }
};

const stateColor = (state: string) => {
  switch (state) {
    case 'working': case 'walking': return 'bg-status-working';
    case 'on-break': return 'bg-status-break';
    case 'waiting': case 'needs-attention': return 'bg-status-waiting';
    case 'sleeping': case 'offline': return 'bg-status-offline';
    case 'paused': return 'bg-muted-foreground';
    default: return 'bg-status-idle';
  }
};

// ── Empty state (first-time users) ──

const EmptyHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display font-bold text-3xl text-foreground mb-3">
          Welcome to Homeroom
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed text-base">
          Homeroom is your AI agent workspace. You create agents, give them instructions, and they do the work &mdash; research, writing, organizing, code review &mdash; like a team of digital assistants you fully control.
        </p>
      </div>

      {/* How it works */}
      <div className="w-full mb-8">
        <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4 text-center">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              icon: Plus,
              title: 'Create an agent',
              desc: 'Pick a template or start from scratch. Give it a name, a role, and instructions for how it should work.',
            },
            {
              step: '2',
              icon: Brain,
              title: 'Connect an AI model',
              desc: 'Add an API key from OpenAI, Anthropic, or others. Your keys stay encrypted on your device.',
            },
            {
              step: '3',
              icon: Play,
              title: 'Run and review',
              desc: 'Send tasks to your agent. Review its output, give feedback, and refine its instructions over time.',
            },
          ].map(item => (
            <div key={item.step} className="relative p-5 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{item.step}</span>
                </div>
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm text-foreground mb-1">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3 mb-10">
        <Button onClick={() => navigate('/templates')} size="lg">
          <Plus className="w-4 h-4" /> Create your first agent
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate('/office')}>
          Explore the office
        </Button>
      </div>

      {/* Trust signals */}
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-6 justify-center text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Keys encrypted on device</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Full audit trail</span>
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Runs locally or in cloud</span>
        </div>
      </div>
    </div>
  );
};

// ── Setup checklist ──

const SetupChecklist: React.FC = () => {
  const navigate = useNavigate();
  const agents = useAgents();
  const hasModel = isModelConfigured();
  const hasKey = Object.keys(PROVIDER_INFO).some(k => hasProviderKey(k));
  const hasAgent = agents.length > 0;

  const steps = [
    { done: hasKey, label: 'Connect an AI provider', desc: 'Add an API key so agents can think', action: () => navigate('/setup'), actionLabel: 'Set up keys' },
    { done: hasModel, label: 'Configure a model', desc: 'Choose which AI brain powers your agents', action: () => navigate('/settings'), actionLabel: 'Settings' },
    { done: hasAgent, label: 'Create your first agent', desc: 'Pick a template or build one from scratch', action: () => navigate('/templates'), actionLabel: 'Create agent' },
  ];

  const allDone = steps.every(s => s.done);
  if (allDone) return null;

  const completedCount = steps.filter(s => s.done).length;

  return (
    <div className="p-4 bg-card border border-border rounded-xl mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold text-sm text-foreground">Getting started</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">{completedCount}/{steps.length} done</span>
      </div>
      <div className="space-y-2">
        {steps.map(step => (
          <div key={step.label} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${step.done ? 'bg-muted/40' : 'bg-muted/70'}`}>
            {step.done ? (
              <CheckCircle2 className="w-4 h-4 text-status-working shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${step.done ? 'text-muted-foreground line-through' : 'font-medium text-foreground'}`}>{step.label}</p>
              {!step.done && <p className="text-[11px] text-muted-foreground">{step.desc}</p>}
            </div>
            {!step.done && (
              <Button size="sm" variant="outline" className="text-xs h-7 shrink-0" onClick={step.action}>
                {step.actionLabel} <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Agent roster row ──

const AgentRow: React.FC<{ agent: ReturnType<typeof useAgents>[number] }> = ({ agent }) => {
  const navigate = useNavigate();
  const latestRun = agent.runs[0];

  return (
    <button
      onClick={() => navigate(`/agents/${agent.id}`)}
      className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm hover:border-muted-foreground/20 transition-all text-left group"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0"
        style={{ backgroundColor: agent.appearance.outfitColor }}
      >
        {agent.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{agent.name}</p>
          <span className="text-[10px] text-muted-foreground">{agent.role}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {agent.currentTask || (latestRun ? `Last: ${latestRun.inputSummary}` : 'No tasks yet')}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${stateColor(agent.state)}`} />
          <span className="text-[11px] text-muted-foreground">{stateLabel(agent.state)}</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
      </div>
    </button>
  );
};

// ── Main dashboard ──

const HomePage: React.FC = () => {
  const agents = useAgents();
  const navigate = useNavigate();

  if (agents.length === 0) return <EmptyHome />;

  const activeAgents = agents.filter(a => a.state === 'working' || a.state === 'walking');
  const needsAttention = agents.filter(a => a.state === 'waiting' || a.state === 'needs-attention');
  const idleAgents = agents.filter(a => !['working', 'walking', 'waiting', 'needs-attention'].includes(a.state));

  const allRuns = agents
    .flatMap(a => a.runs.map(r => ({ ...r, agentName: a.name, agentColor: a.appearance.outfitColor })))
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">{greeting}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {agents.length} agent{agents.length !== 1 ? 's' : ''} in your office
          {activeAgents.length > 0 && <> &mdash; <span className="text-status-working font-medium">{activeAgents.length} working now</span></>}
          {needsAttention.length > 0 && <> &mdash; <span className="text-status-waiting font-medium">{needsAttention.length} need{needsAttention.length === 1 ? 's' : ''} attention</span></>}
        </p>
      </div>

      {/* Setup checklist (hides when complete) */}
      <SetupChecklist />

      {/* Needs attention banner */}
      {needsAttention.length > 0 && (
        <div className="p-4 bg-status-waiting/5 border border-status-waiting/20 rounded-xl mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-status-waiting" />
            <p className="text-sm font-semibold text-foreground">Needs your attention</p>
          </div>
          <div className="space-y-2">
            {needsAttention.map(a => (
              <button
                key={a.id}
                onClick={() => navigate(`/agents/${a.id}`)}
                className="w-full flex items-center gap-3 p-2.5 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow text-left"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground" style={{ backgroundColor: a.appearance.outfitColor }}>
                  {a.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.currentTask || 'Waiting for input'}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Agent roster */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-sm text-foreground">Your agents</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/office')}>
              <Eye className="w-3 h-3" /> Office view
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => navigate('/templates')}>
              <Plus className="w-3 h-3" /> New
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {agents.map(agent => (
            <AgentRow key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Recent runs */}
      {allRuns.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm text-foreground">Recent runs</h2>
            <button onClick={() => navigate('/activity')} className="text-xs text-primary hover:underline flex items-center gap-1">
              All activity <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {allRuns.map(run => (
              <div key={run.id} className="flex items-start gap-2.5 p-2.5 bg-card border border-border rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  run.status === 'completed' ? 'bg-status-working' :
                  run.status === 'running' ? 'bg-primary animate-pulse' :
                  run.status === 'failed' ? 'bg-destructive' : 'bg-muted-foreground'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{run.inputSummary}</p>
                  <p className="text-[10px] text-muted-foreground">{run.agentName} &middot; {timeAgo(run.startedAt)}</p>
                </div>
                <RunStatusBadge status={run.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="font-display font-semibold text-sm text-foreground mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickAction icon={Plus} label="Create agent" onClick={() => navigate('/templates')} />
          <QuickAction icon={Play} label="Run an agent" onClick={() => navigate('/agents')} />
          <QuickAction icon={Shield} label="Trust center" onClick={() => navigate('/activity?tab=trust')} />
          <QuickAction icon={Settings} label="Settings" onClick={() => navigate('/settings')} />
        </div>
      </div>
    </div>
  );
};

// ── Small components ──

const QuickAction = ({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors text-left">
    <Icon className="w-4 h-4 text-primary shrink-0" />
    <span className="text-xs font-medium text-foreground">{label}</span>
  </button>
);

const RunStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    completed: 'bg-status-working/10 text-status-working',
    running: 'bg-primary/10 text-primary',
    failed: 'bg-destructive/10 text-destructive',
    pending: 'bg-muted text-muted-foreground',
    cancelled: 'bg-muted text-muted-foreground',
  };
  const labels: Record<string, string> = {
    completed: 'Success',
    running: 'Running',
    failed: 'Failed',
    pending: 'Pending',
    cancelled: 'Cancelled',
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default HomePage;