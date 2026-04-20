import React, { useState, useMemo } from 'react';
import { useAgents as useAgentsStore } from '@/store/agentStore';
import { useAgents as useAgentsQuery } from '@/hooks/api/useAgents';
import { STATE_LABELS } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StateCoverage from '@/components/StateCoverage';
import {
  Plus, Search, Cpu, Cloud, Play, AlertTriangle, Zap,
  Clock, ArrowRight, Filter, Power, Users, Shield,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { updateAgent } from '@/store/agentStore';
import { toast } from 'sonner';

const stateColor = (state: string) => {
  switch (state) {
    case 'working': return 'bg-status-working';
    case 'on-break': return 'bg-status-break';
    case 'waiting': case 'needs-attention': return 'bg-status-waiting';
    case 'sleeping': case 'offline': return 'bg-status-offline';
    default: return 'bg-status-idle';
  }
};

const timeAgo = (date: Date) => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

type FilterType = 'all' | 'active' | 'paused' | 'attention' | 'local' | 'cloud';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'attention', label: 'Needs Attention' },
  { id: 'local', label: 'Local' },
  { id: 'cloud', label: 'Cloud' },
];

const AgentsPage: React.FC = () => {
  const query = useAgentsQuery();
  const storeAgents = useAgentsStore();
  // Prefer live backend data; fall back to local store when backend is unreachable
  const agents = query.data ?? storeAgents;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') as FilterType | null;
  const [filter, setFilter] = useState<FilterType>(initialFilter || 'all');
  const [search, setSearch] = useState('');
  const loading = query.isLoading;

  const filtered = useMemo(() => {
    let result = agents;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.purpose.toLowerCase().includes(q));
    }
    switch (filter) {
      case 'active': return result.filter(a => a.state === 'working' || a.state === 'walking' || a.state === 'idle');
      case 'paused': return result.filter(a => a.state === 'paused' || a.state === 'offline' || a.state === 'sleeping');
      case 'attention': return result.filter(a => a.state === 'waiting' || a.state === 'needs-attention');
      case 'local': return result.filter(a => a.runtimeMode === 'local');
      case 'cloud': return result.filter(a => a.runtimeMode === 'cloud' || a.runtimeMode === 'hybrid');
      default: return result;
    }
  }, [agents, filter, search]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground">{agents.length} teammate{agents.length !== 1 ? 's' : ''} in your team</p>
        </div>
        <Button onClick={() => navigate('/templates')}>
          <Plus className="w-4 h-4" /> New Agent
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {f.label}
              {f.id === 'attention' && agents.filter(a => a.state === 'waiting' || a.state === 'needs-attention').length > 0 && (
                <span className="ml-1 text-[10px]">({agents.filter(a => a.state === 'waiting' || a.state === 'needs-attention').length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Cards */}
      <StateCoverage
        loading={loading}
        empty={agents.length === 0}
        emptyIcon={Users}
        emptyTitle="Your team is empty"
        emptyDescription="Create your first agent to get started. Pick a template or build from scratch."
        emptyAction={{ label: 'Create Agent', onClick: () => navigate('/templates') }}
        loadingRows={4}
      >
        <div className="grid gap-3">
          {filtered.map(agent => (
            <button
              key={agent.id}
              onClick={() => navigate(`/agents/${agent.id}`)}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-all text-left group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-primary-foreground shadow-sm relative shrink-0"
                style={{ backgroundColor: (agent as any).appearance?.outfitColor ?? (agent as any).outfitColor ?? '#6366f1' }}
              >
                {agent.name[0]}
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${stateColor(agent.state)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-foreground">{agent.name}</h3>
                  <span className="text-xs text-muted-foreground">{STATE_LABELS[agent.state]}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{agent.purpose || agent.role}</p>
                {agent.currentTask && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                    <Zap className="w-3 h-3 text-status-working" /> {agent.currentTask}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1.5">
                  {agent.runtimeMode === 'local' ? (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      <Cpu className="w-3 h-3" /> Local
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      <Cloud className="w-3 h-3" /> Cloud
                    </span>
                  )}
                  {!agent.hasPermissions && agent.enabled && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Shield className="w-3 h-3" /> No rules
                    </span>
                  )}
                </div>
                {agent.lastRunAt && (
                  <span className="text-[10px] text-muted-foreground">Last run {timeAgo(agent.lastRunAt)}</span>
                )}
                {(agent as any).scheduleSummary && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {(agent as any).scheduleSummary}
                  </span>
                )}
                {agent.lastRunStatus === 'failed' && (
                  <span className="text-[10px] text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Last run failed
                  </span>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          ))}

          {filtered.length === 0 && agents.length > 0 && (
            <div className="text-center py-12">
              <Filter className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground font-medium">No agents match your filters</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setFilter('all'); setSearch(''); }}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </StateCoverage>
    </div>
  );
};

export default AgentsPage;
