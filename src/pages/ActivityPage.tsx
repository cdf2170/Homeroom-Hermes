import React, { useState, useMemo } from 'react';
import { useAgents } from '@/store/agentStore';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search, Activity, AlertTriangle, CheckCircle2, Clock,
  Filter, Zap, ArrowRight, Loader2,
} from 'lucide-react';

const timeAgo = (date: Date) => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

type StatusFilter = 'all' | 'completed' | 'running' | 'failed' | 'pending';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'running', label: 'Running' },
  { id: 'completed', label: 'Success' },
  { id: 'failed', label: 'Failed' },
  { id: 'pending', label: 'Pending' },
];

const runStatusStyle: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  completed: { bg: 'bg-status-working/10', text: 'text-status-working', label: 'Success', icon: CheckCircle2 },
  running: { bg: 'bg-primary/10', text: 'text-primary', label: 'Running', icon: Loader2 },
  failed: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Failed', icon: AlertTriangle },
  pending: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Pending', icon: Clock },
  cancelled: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Cancelled', icon: Clock },
};

const ActivityPage: React.FC = () => {
  const agents = useAgents();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const allRuns = useMemo(() =>
    agents
      .flatMap(a => a.runs.map(r => ({ ...r, agentName: a.name, agentColor: a.appearance.outfitColor, agentId: a.id })))
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()),
    [agents]
  );

  const filtered = useMemo(() => {
    let result = allRuns;
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    if (agentFilter) result = result.filter(r => r.agentId === agentFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.inputSummary.toLowerCase().includes(q) || r.agentName.toLowerCase().includes(q) || (r.outputSummary?.toLowerCase().includes(q)));
    }
    return result;
  }, [allRuns, statusFilter, agentFilter, search]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Activity</h1>
        <p className="text-sm text-muted-foreground">Timeline of runs across all agents</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search runs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agent filter chips */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button
          onClick={() => setAgentFilter(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!agentFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
        >
          All agents
        </button>
        {agents.map(a => (
          <button
            key={a.id}
            onClick={() => setAgentFilter(a.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
              agentFilter === a.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.appearance.outfitColor }} />
            {a.name}
          </button>
        ))}
      </div>

      {/* Runs timeline */}
      <div className="space-y-2">
        {filtered.map(run => {
          const style = runStatusStyle[run.status] || runStatusStyle.pending;
          const StatusIcon = style.icon;
          return (
            <div key={run.id} className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-shadow">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0"
                style={{ backgroundColor: run.agentColor }}
              >
                {run.agentName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => navigate(`/agents/${run.agentId}`)}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {run.agentName}
                  </button>
                  <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                    <StatusIcon className={`w-3 h-3 ${run.status === 'running' ? 'animate-spin' : ''}`} />
                    {style.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">{run.trigger}</span>
                </div>
                <p className="text-sm text-foreground">{run.inputSummary}</p>
                {run.outputSummary && (
                  <p className="text-xs text-muted-foreground mt-1">{run.outputSummary}</p>
                )}
                {run.errorSummary && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {run.errorSummary}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{timeAgo(run.startedAt)}</span>
            </div>
          );
        })}

        {filtered.length === 0 && allRuns.length > 0 && (
          <div className="text-center py-12">
            <Filter className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground font-medium">No runs match your filters</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setStatusFilter('all'); setAgentFilter(null); setSearch(''); }}>
              Clear filters
            </Button>
          </div>
        )}

        {allRuns.length === 0 && (
          <div className="text-center py-16">
            <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your agents will show runs here once they start working.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
