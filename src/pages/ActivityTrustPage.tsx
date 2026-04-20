import React, { useState, useMemo } from 'react';
import { useAgents as useAgentsQuery, useAllRuns, useTrustFindings, useCredentials } from '@/hooks/api/useAgents';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StateCoverage from '@/components/StateCoverage';
import {
  Search, Activity, AlertTriangle, CheckCircle2, Clock,
  Filter, Loader2, Shield, ShieldCheck, ShieldAlert,
  Cpu, Cloud, Eye, Lock, ArrowRight, Key,
  RefreshCw, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

// ── Tabs ──
type Tab = 'runs' | 'trust';

// ── Timestamp formatting ──
const formatTimestamp = (date: Date) => format(date, 'MMM d, yyyy · h:mm:ss a');

// ── Run status styles ──
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

// ── Finding type (mirrors backend shape) ──
interface Finding {
  id: string;
  level: 'ok' | 'info' | 'warning' | 'risk';
  title: string;
  detail: string;
  agentId?: string;
  agentName?: string;
}

// ── Main Page ──

const ActivityTrustPage: React.FC = () => {
  const { data: queryAgents = [], isLoading: agentsLoading } = useAgentsQuery();
  const { data: backendRuns = [], isLoading: runsLoading } = useAllRuns();
  const { data: credentials = [] } = useCredentials();
  const navigate = useNavigate();
  const loading = agentsLoading || runsLoading;

  const [tab, setTab] = useState<Tab>('runs');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [trustSearch, setTrustSearch] = useState('');
  const [trustLevel, setTrustLevel] = useState<'all' | 'warning' | 'info'>('all');

  // Build a lookup map for agent name + color from backend data
  const agentLookup = useMemo(
    () => new Map(queryAgents.map(a => [a.id, a])),
    [queryAgents],
  );

  // Runs data — from backend, joined with agent info
  const allRuns = useMemo(() =>
    backendRuns
      .map(r => {
        const a = agentLookup.get(r.agentId);
        return {
          id:            r.id,
          agentId:       r.agentId,
          agentName:     a?.name ?? 'Unknown',
          agentColor:    (a as any)?.outfitColor ?? '#6366f1',
          status:        r.status,
          trigger:       r.trigger,
          inputSummary:  r.inputSummary,
          outputSummary: r.outputSummary || null,
          errorSummary:  r.errorSummary,
          startedAt:     new Date(r.startedAt),
          finishedAt:    r.finishedAt ? new Date(r.finishedAt) : null,
        };
      })
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()),
    [backendRuns, agentLookup],
  );

  const filteredRuns = useMemo(() => {
    let result = allRuns;
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    if (agentFilter) result = result.filter(r => r.agentId === agentFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.inputSummary.toLowerCase().includes(q) || r.agentName.toLowerCase().includes(q) || (r.outputSummary?.toLowerCase().includes(q)));
    }
    return result;
  }, [allRuns, statusFilter, agentFilter, search]);

  // Trust data — backend only
  const { data: backendFindings = [] } = useTrustFindings();
  const findings = useMemo<Finding[]>(() => {
    if (backendFindings.length === 0) return [];
    return backendFindings.map(f => ({
      id: f.id,
      level: (f.level as Finding['level']) ?? 'info',
      title: f.title,
      detail: f.detail,
      agentId: f.agentId,
      agentName: queryAgents.find(a => a.id === f.agentId)?.name,
    }));
  }, [backendFindings, queryAgents]);
  const warnings = findings.filter(f => f.level === 'warning' || f.level === 'risk');
  const infos = findings.filter(f => f.level === 'info');
  const allGood = warnings.length === 0;

  const filteredFindings = useMemo(() => {
    let result = findings.filter(f => f.level !== 'ok');
    if (trustLevel === 'warning') result = result.filter(f => f.level === 'warning' || f.level === 'risk');
    if (trustLevel === 'info') result = result.filter(f => f.level === 'info');
    if (trustSearch) {
      const q = trustSearch.toLowerCase();
      result = result.filter(f => f.title.toLowerCase().includes(q) || f.detail.toLowerCase().includes(q) || f.agentName?.toLowerCase().includes(q));
    }
    return result;
  }, [findings, trustLevel, trustSearch]);

  const localAgents = queryAgents.filter(a => a.runtimeMode === 'local');
  const cloudAgents = queryAgents.filter(a => a.runtimeMode === 'cloud' || a.runtimeMode === 'hybrid');
  const bgAgents = queryAgents.filter(a => a.backgroundEnabled);
  const connectedProviders = new Set(credentials.map(c => c.provider));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Activity & Trust</h1>
          <p className="text-sm text-muted-foreground">Run history, risk analysis, and agent permissions</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          warnings.length === 0 ? 'bg-status-working/10 text-status-working'
          : warnings.length <= 3 ? 'bg-status-waiting/10 text-status-waiting'
          : 'bg-destructive/10 text-destructive'
        }`}>
          {warnings.length === 0 ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          {warnings.length === 0 ? 'All Clear' : warnings.length <= 3 ? `Review Needed — ${warnings.length} item${warnings.length !== 1 ? 's' : ''}` : `Needs Attention — ${warnings.length} issues`}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setTab('runs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'runs' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Runs
        </button>
        <button
          onClick={() => setTab('trust')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'trust' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Trust & Permissions
          {warnings.length > 0 && (
            <span className="ml-1.5 w-5 h-5 rounded-full bg-status-waiting/15 text-status-waiting text-[10px] font-bold inline-flex items-center justify-center">
              {warnings.length}
            </span>
          )}
        </button>
      </div>

      <StateCoverage loading={loading} loadingRows={6}>
        {tab === 'runs' && (
          <>
            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search runs by agent, input, or output..."
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
              {queryAgents.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAgentFilter(a.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    agentFilter === a.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: (a as any).outfitColor ?? '#6366f1' }} />
                  {a.name}
                </button>
              ))}
            </div>

            {/* Runs list */}
            {allRuns.length === 0 ? (
              <div className="text-center py-16">
                <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium text-foreground">No activity yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your agents will show runs here once they start working.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRuns.map(run => {
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
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatTimestamp(run.startedAt)}
                          {run.finishedAt && (
                            <span className="ml-2">· Finished {formatTimestamp(run.finishedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredRuns.length === 0 && allRuns.length > 0 && (
                  <div className="text-center py-12">
                    <Filter className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground font-medium">No runs match your filters</p>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setStatusFilter('all'); setAgentFilter(null); setSearch(''); }}>
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'trust' && (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <OverviewCard icon={Shield} label="Overall Status" value={warnings.length === 0 ? 'All Clear' : warnings.length <= 3 ? 'Review' : 'At Risk'} accent={warnings.length === 0 ? 'ok' : 'warning'} />
              <OverviewCard icon={Cpu} label="Local Agents" value={localAgents.length} />
              <OverviewCard icon={Cloud} label="Cloud Agents" value={cloudAgents.length} />
              <OverviewCard icon={RefreshCw} label="Background" value={bgAgents.length} />
            </div>

            {/* Search + filter for trust */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search findings..."
                  value={trustSearch}
                  onChange={e => setTrustSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1.5">
                {(['all', 'warning', 'info'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setTrustLevel(level)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      trustLevel === level ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {level === 'all' ? 'All' : level === 'warning' ? 'Warnings' : 'Info'}
                  </button>
                ))}
              </div>
            </div>

            {/* Findings */}
            {allGood && infos.length === 0 && !trustSearch ? (
              <div className="p-8 bg-status-working/5 border border-status-working/20 rounded-xl text-center mb-6">
                <ShieldCheck className="w-10 h-10 text-status-working mx-auto mb-3" />
                <p className="text-lg font-semibold text-foreground mb-1">All Clear</p>
                <p className="text-sm text-muted-foreground mb-4">All agents have appropriate permissions and boundaries. Nothing needs your attention.</p>
                <div className="flex flex-wrap justify-center gap-3 text-[11px] text-muted-foreground">
                  <span>{queryAgents.length} agent{queryAgents.length !== 1 ? 's' : ''} reviewed</span>
                  <span className="text-border">.</span>
                  <span>{localAgents.length} local</span>
                  <span className="text-border">.</span>
                  <span>{cloudAgents.length} cloud</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {filteredFindings.map(f => (
                  <FindingCard key={f.id} finding={f} onNavigate={f.agentId ? () => navigate(`/agents/${f.agentId}`) : undefined} />
                ))}
                {filteredFindings.length === 0 && (
                  <div className="text-center py-8">
                    <Filter className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No findings match your filters</p>
                  </div>
                )}
              </div>
            )}

            {/* Agent Permissions + Secrets */}
            <div className="grid md:grid-cols-2 gap-6">
              <section>
                <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" /> Agent Permissions
                </h2>
                <div className="space-y-2">
                  {queryAgents.map(a => (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/agents/${a.id}`)}
                      className="w-full p-3 bg-card border border-border rounded-xl text-left hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ backgroundColor: (a as any).outfitColor ?? '#6366f1' }}>
                          {a.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{a.name}</p>
                          <p className="text-[10px] text-muted-foreground">{a.role}</p>
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${a.enabled ? 'bg-status-working/10 text-status-working' : 'bg-muted text-muted-foreground'}`}>
                          {a.enabled ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <PermChip icon={a.runtimeMode === 'local' ? Cpu : Cloud} label={a.runtimeMode === 'local' ? 'Runs locally' : 'Uses cloud AI'} />
                        <PermChip icon={a.backgroundEnabled ? RefreshCw : Clock} label={a.backgroundEnabled ? 'Runs in background' : 'Manual only'} />
                      </div>
                    </button>
                  ))}
                  {queryAgents.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">No agents yet</p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" /> Secrets & Connections
                </h2>
                <div className="space-y-2">
                  <div className="p-3 bg-card border border-border rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs font-semibold text-foreground">API keys are stored securely</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Keys are never shown to agents or included in prompts. They{'\u2019'}re only used to connect to model providers.
                    </p>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs font-semibold text-foreground">No secrets in agent output</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Agent logs and outputs are checked to prevent accidental exposure of API keys or tokens.
                    </p>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl">
                    <p className="text-xs font-semibold text-foreground mb-1.5">Provider connections</p>
                    {credentials.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">No providers connected. Add API keys in Settings.</p>
                    ) : (
                      <div className="space-y-1">
                        {credentials.map(c => (
                          <div key={c.provider} className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground capitalize">{c.provider}</span>
                            <span className="font-medium text-status-working">{c.masked}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">How Homeroom keeps you safe:</span> All agents have explicit permission boundaries. Cloud connections are opt-in. Background agents require your approval. API keys are never exposed to agents or shown in outputs.
              </p>
            </div>
          </>
        )}
      </StateCoverage>
    </div>
  );
};

// ── Sub-components ──

const OverviewCard = ({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent?: string }) => (
  <div className="p-4 bg-card border border-border rounded-xl">
    <Icon className={`w-4 h-4 mb-2 ${accent === 'ok' ? 'text-status-working' : accent === 'warning' ? 'text-status-waiting' : 'text-muted-foreground'}`} />
    <p className="text-xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const FindingCard = ({ finding, onNavigate }: { finding: Finding; onNavigate?: () => void }) => {
  const recommendation = finding.level === 'risk'
    ? 'Action needed — this agent may be running without safety boundaries'
    : finding.level === 'warning'
    ? 'Review and update permissions'
    : 'For your awareness';

  return (
    <div className={`p-3 rounded-xl border flex items-start gap-3 ${
      finding.level === 'risk'
        ? 'bg-destructive/5 border-destructive/20'
        : finding.level === 'warning'
        ? 'bg-status-waiting/5 border-status-waiting/20'
        : 'bg-card border-border'
    }`}>
      {finding.level === 'risk'
        ? <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        : finding.level === 'warning'
        ? <AlertTriangle className="w-4 h-4 text-status-waiting shrink-0 mt-0.5" />
        : <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{finding.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{finding.detail}</p>
        <p className={`text-[10px] mt-1 font-medium ${
          finding.level === 'risk' ? 'text-destructive' : finding.level === 'warning' ? 'text-status-waiting' : 'text-muted-foreground/70'
        }`}>{recommendation}</p>
      </div>
      {onNavigate && (
        <button onClick={onNavigate} className="text-xs text-primary hover:underline flex items-center gap-0.5 shrink-0">
          {finding.level === 'risk' ? 'Fix now' : 'Review'} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

const PermChip = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <span className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">
    <Icon className="w-2.5 h-2.5" /> {label}
  </span>
);

export default ActivityTrustPage;
