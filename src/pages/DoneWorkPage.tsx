import React, { useState, useMemo } from 'react';
import { CheckSquare, CheckCircle2, XCircle, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAllRuns, useAgents } from '@/hooks/api/useAgents';
import type { BackendRun } from '@/services/backendApi';

// ── Helpers ──

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

function colorFromString(s: string): string {
  const palette = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  completed: { label: 'Completed', className: 'bg-status-working/15 text-status-working border-none', icon: CheckCircle2 },
  failed:    { label: 'Failed',    className: 'bg-destructive/10 text-destructive border-none',       icon: XCircle },
  running:   { label: 'Running',   className: 'bg-primary/10 text-primary border-none',               icon: Loader2 },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border-none',           icon: Clock },
};

type FilterKey = 'all' | 'completed' | 'failed';

const AgentInitials = ({ name, color }: { name: string; color: string }) => (
  <div
    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
    style={{ backgroundColor: color }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
);

// ── Detail Panel ──

const RunDetailPanel = ({ run, agentName, agentColor, onClose }: {
  run: BackendRun;
  agentName: string;
  agentColor: string;
  onClose: () => void;
}) => {
  const cfg = statusConfig[run.status] ?? statusConfig.completed;

  return (
    <div className="flex flex-col h-full border-l border-border bg-background">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <AgentInitials name={agentName} color={agentColor} />
          <div>
            <p className="font-semibold text-sm text-foreground">{agentName}</p>
            <p className="text-xs text-muted-foreground truncate">{run.inputSummary || '(no input)'}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge className={cfg.className}>{cfg.label}</Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {run.finishedAt ? timeAgo(run.finishedAt) : 'In progress'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {run.outputSummary && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Output</p>
            <div className="bg-muted rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono text-xs">
              {run.outputSummary}
            </div>
          </>
        )}

        {run.errorSummary && (
          <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
            <p className="text-[10px] font-semibold text-destructive uppercase tracking-wide mb-1">Error</p>
            <p className="text-xs text-foreground font-mono whitespace-pre-wrap">{run.errorSummary}</p>
          </div>
        )}

        {!run.outputSummary && !run.errorSummary && (
          <p className="text-sm text-muted-foreground text-center py-8">No output yet.</p>
        )}
      </div>
    </div>
  );
};

// ── Page ──

const DoneWorkPage: React.FC = () => {
  const { data: runs = [], isLoading } = useAllRuns(200);
  const { data: agents = [] } = useAgents();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<string | null>(null);

  // Build agent lookup
  const agentMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    agents.forEach(a => map.set(a.id, { name: a.name, color: a.outfitColor ?? colorFromString(a.id) }));
    return map;
  }, [agents]);

  // Filter to settled runs (completed + failed)
  const settledRuns = useMemo(() => {
    let result = runs.filter(r => r.status === 'completed' || r.status === 'failed');
    if (filter === 'completed') result = result.filter(r => r.status === 'completed');
    if (filter === 'failed') result = result.filter(r => r.status === 'failed');
    return result;
  }, [runs, filter]);

  const completedCount = runs.filter(r => r.status === 'completed').length;
  const failedCount = runs.filter(r => r.status === 'failed').length;
  const selectedRun = settledRuns.find(r => r.id === selected) ?? null;

  const FILTERS: { key: FilterKey; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: completedCount + failedCount },
    { key: 'completed', label: 'Completed', count: completedCount },
    { key: 'failed', label: 'Failed', count: failedCount },
  ];

  return (
    <div className="h-full flex">
      {/* Left panel */}
      <div className={`flex flex-col ${selectedRun ? 'w-1/2' : 'w-full'} transition-all`}>
        <div className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-2xl text-foreground">Done Work</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Completed agent runs and their output.
          </p>

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
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : settledRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No completed work yet</p>
              <p className="text-xs text-muted-foreground">Run an agent to see results here.</p>
            </div>
          ) : (
            settledRuns.map(run => {
              const agent = agentMap.get(run.agentId);
              const name = agent?.name ?? 'Unknown';
              const color = agent?.color ?? '#888';
              const cfg = statusConfig[run.status] ?? statusConfig.completed;

              return (
                <div
                  key={run.id}
                  onClick={() => setSelected(run.id === selected ? null : run.id)}
                  className={`p-4 bg-card border rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                    selected === run.id ? 'border-primary/50 shadow-sm' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AgentInitials name={name} color={color} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {run.inputSummary || '(no input)'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {name} · {run.finishedAt ? timeAgo(run.finishedAt) : 'In progress'}
                      </p>
                      {run.outputSummary && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {run.outputSummary.slice(0, 120)}{run.outputSummary.length > 120 ? '...' : ''}
                        </p>
                      )}
                      {run.errorSummary && (
                        <p className="text-xs text-destructive leading-relaxed line-clamp-2">
                          {run.errorSummary.slice(0, 120)}{run.errorSummary.length > 120 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge className={cfg.className + ' text-[10px]'}>{cfg.label}</Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel — detail */}
      {selectedRun && (
        <div className="w-1/2 flex flex-col">
          <RunDetailPanel
            run={selectedRun}
            agentName={agentMap.get(selectedRun.agentId)?.name ?? 'Unknown'}
            agentColor={agentMap.get(selectedRun.agentId)?.color ?? '#888'}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
};

export default DoneWorkPage;
