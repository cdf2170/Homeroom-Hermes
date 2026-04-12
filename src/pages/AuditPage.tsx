import React, { useState } from 'react';
import { useAuditLog, useAgents } from '@/hooks/api/useAgents';
import { useAgents as useAgentsStore } from '@/store/agentStore';
import { Shield, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const timeAgo = (date: Date) => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const sourceColor = (source: string) => {
  switch (source) {
    case 'user':     return 'bg-primary/15 text-primary';
    case 'agent':    return 'bg-status-working/15 text-status-working';
    case 'schedule': return 'bg-status-waiting/15 text-status-waiting';
    default:         return 'bg-muted text-muted-foreground';
  }
};

const AuditPage: React.FC = () => {
  const { data: events = [], isLoading } = useAuditLog(200);
  // Use query-backed agents for filter chips; fall back to store if backend unreachable
  const agentQuery = useAgents();
  const storeAgents = useAgentsStore();
  const agents = agentQuery.data ?? storeAgents;

  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter
    ? events.filter(e => e.targetId === filter || e.actor === filter)
    : events;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Audit Trail</h1>
            <p className="text-sm text-muted-foreground">Every action, fully attributable</p>
          </div>
        </div>
        {filter && (
          <Button size="sm" variant="outline" onClick={() => setFilter(null)}>
            <Filter className="w-3 h-3" /> Clear filter
          </Button>
        )}
      </div>

      {/* Agent filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!filter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
        >
          All
        </button>
        {agents.map(a => (
          <button
            key={a.id}
            onClick={() => setFilter(a.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${filter === a.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: (a as any).appearance?.outfitColor ?? (a as any).outfitColor ?? '#6366f1' }}
            />
            {a.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Events table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 px-4 py-2 bg-muted text-xs font-semibold text-muted-foreground border-b border-border">
              <span>Time</span>
              <span>Event</span>
              <span>Source</span>
              <span>Context</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.slice(0, 100).map(event => (
                <div
                  key={event.id}
                  className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 px-4 py-2.5 text-xs hover:bg-muted/30 transition-colors items-center"
                >
                  <span className="text-muted-foreground whitespace-nowrap w-16">
                    {timeAgo(new Date(event.timestamp))}
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">{event.actor}</span>
                    <span className="text-muted-foreground"> · {event.eventType.replace(/[._]/g, ' ')}</span>
                    <p className="text-muted-foreground truncate">{event.summary}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sourceColor(event.sourceMode)}`}>
                    {event.sourceMode}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {event.targetType || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No events yet</p>
              <p className="text-sm text-muted-foreground">All agent actions will be logged here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditPage;
