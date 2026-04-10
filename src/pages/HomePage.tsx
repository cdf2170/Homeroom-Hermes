import React from 'react';
import { useAgents } from '@/store/agentStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Plus, Play, AlertTriangle, Users, Zap, Clock, CheckCircle2,
  ArrowRight, Cpu, Cloud, Sparkles, Activity,
} from 'lucide-react';

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

const HomePage: React.FC = () => {
  const agents = useAgents();
  const navigate = useNavigate();

  const activeAgents = agents.filter(a => a.state === 'working' || a.state === 'walking');
  const needsAttention = agents.filter(a => a.state === 'waiting' || a.state === 'needs-attention');
  const localAgents = agents.filter(a => a.runtimeMode === 'local');
  const cloudAgents = agents.filter(a => a.runtimeMode === 'cloud' || a.runtimeMode === 'hybrid');

  const allRuns = agents
    .flatMap(a => a.runs.map(r => ({ ...r, agentName: a.name, agentColor: a.appearance.outfitColor })))
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .slice(0, 8);

  const allActivities = agents
    .flatMap(a => a.activities.map(act => ({ ...act, agentName: a.name, agentColor: a.appearance.outfitColor })))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6);

  if (agents.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground mb-2 text-center">Welcome to Homeroom</h1>
        <p className="text-muted-foreground text-center max-w-md mb-2">
          Your AI agents live here as digital teammates. They can research, write, organize, review code, and handle the busywork — so you can focus on what matters.
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          Create your first agent to get started. It takes about 2 minutes.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/templates')}>
            <Plus className="w-4 h-4" /> Create your first agent
          </Button>
          <Button variant="outline" onClick={() => navigate('/office')}>
            Visit the office
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-md">
          {[
            { icon: Users, label: 'Build a team', desc: 'Create agents for different tasks' },
            { icon: Cpu, label: 'Stay in control', desc: 'Set rules, permissions, and memory' },
            { icon: Activity, label: 'See everything', desc: 'Track runs, outputs, and history' },
          ].map(f => (
            <div key={f.label} className="text-center p-3 bg-card border border-border rounded-xl">
              <f.icon className="w-5 h-5 mx-auto text-primary mb-1.5" />
              <p className="text-xs font-semibold text-foreground">{f.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Home</h1>
          <p className="text-sm text-muted-foreground">Your team at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/office')}>
            Visit office
          </Button>
          <Button size="sm" onClick={() => navigate('/templates')}>
            <Plus className="w-4 h-4" /> New Agent
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard icon={Users} label="Total Agents" value={agents.length} onClick={() => navigate('/agents')} />
        <SummaryCard icon={Zap} label="Active Now" value={activeAgents.length} accent="working" onClick={() => navigate('/agents?filter=active')} />
        <SummaryCard icon={AlertTriangle} label="Needs Attention" value={needsAttention.length} accent={needsAttention.length > 0 ? 'attention' : undefined} onClick={() => navigate('/agents?filter=attention')} />
        <SummaryCard icon={CheckCircle2} label="Recent Runs" value={allRuns.length} onClick={() => navigate('/activity')} />
      </div>

      {/* Runtime Status */}
      <div className="flex gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-xs">
          <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{localAgents.length} local</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-xs">
          <Cloud className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{cloudAgents.length} cloud</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Agents needing attention */}
        {needsAttention.length > 0 && (
          <div className="md:col-span-2 p-4 bg-status-waiting/5 border border-status-waiting/20 rounded-xl">
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

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm text-foreground">Recent Activity</h2>
            <button onClick={() => navigate('/activity')} className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            {allActivities.map(act => (
              <div key={act.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0" style={{ backgroundColor: act.agentColor }}>
                  {act.agentName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">{act.agentName}</span>{' '}
                    <span className="text-muted-foreground">{act.detail}</span>
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(act.timestamp)}</span>
              </div>
            ))}
            {allActivities.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">No activity yet</p>
            )}
          </div>
        </div>

        {/* Recent Runs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm text-foreground">Recent Runs</h2>
            <button onClick={() => navigate('/activity')} className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {allRuns.map(run => (
              <div key={run.id} className="flex items-start gap-2.5 p-2 bg-card border border-border rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  run.status === 'completed' ? 'bg-status-working' :
                  run.status === 'running' ? 'bg-primary animate-pulse' :
                  run.status === 'failed' ? 'bg-destructive' : 'bg-muted-foreground'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{run.inputSummary}</p>
                  <p className="text-[10px] text-muted-foreground">{run.agentName} · {timeAgo(run.startedAt)}</p>
                  {run.outputSummary && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{run.outputSummary}</p>}
                </div>
                <RunStatusBadge status={run.status} />
              </div>
            ))}
            {allRuns.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">No runs yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-2">
          <h2 className="font-display font-semibold text-sm text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <QuickAction icon={Plus} label="Create agent" onClick={() => navigate('/templates')} />
            <QuickAction icon={Play} label="Run an agent" onClick={() => navigate('/agents')} />
            <QuickAction icon={AlertTriangle} label="Review issues" onClick={() => navigate('/agents?filter=attention')} badge={needsAttention.length > 0 ? needsAttention.length : undefined} />
            <QuickAction icon={Activity} label="View activity" onClick={() => navigate('/activity')} />
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, accent, onClick }: { icon: React.ElementType; label: string; value: number; accent?: string; onClick: () => void }) => (
  <button onClick={onClick} className="p-4 bg-card border border-border rounded-xl text-left hover:shadow-sm transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-4 h-4 ${accent === 'attention' ? 'text-status-waiting' : accent === 'working' ? 'text-status-working' : 'text-muted-foreground'}`} />
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </button>
);

const QuickAction = ({ icon: Icon, label, onClick, badge }: { icon: React.ElementType; label: string; onClick: () => void; badge?: number }) => (
  <button onClick={onClick} className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors text-left">
    <Icon className="w-4 h-4 text-primary shrink-0" />
    <span className="text-xs font-medium text-foreground">{label}</span>
    {badge != null && badge > 0 && (
      <span className="ml-auto text-[10px] font-bold bg-status-waiting/15 text-status-waiting px-1.5 py-0.5 rounded-full">{badge}</span>
    )}
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
