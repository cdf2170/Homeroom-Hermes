import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Building2, Users, AlertTriangle, ArrowRight, Shield,
  RefreshCw, Settings, Plus, Zap, Activity, Loader2,
} from 'lucide-react';
import { useAgents, useTrustFindings, useRuntimeHealth } from '@/hooks/api/useAgents';
import { useConnectionStatus } from '@/lib/connection';

const FrontDeskPage: React.FC = () => {
  const connectionStatus = useConnectionStatus();
  const navigate = useNavigate();
  const { data: summaries = [], isLoading: agentsLoading } = useAgents();
  const { data: backendFindings = [] } = useTrustFindings();
  const { data: health } = useRuntimeHealth();

  const active = summaries.filter(a => a.state === 'working');
  const attention = summaries.filter(a => a.needsAttention);
  const noPerms = summaries.filter(a => !a.hasPermissions && a.enabled);
  const bgUnsafe = summaries.filter(a => a.backgroundEnabled && !a.hasPermissions);
  const reviewFindings = backendFindings.filter(f => f.level === 'warning' || f.level === 'risk');

  const suggestions: { icon: React.ElementType; text: string; action: () => void; border: string }[] = [];

  attention.forEach(a => {
    suggestions.push({
      icon: AlertTriangle, border: 'border-l-amber-400',
      text: `${a.name} needs your input`,
      action: () => navigate(`/agents/${a.id}`),
    });
  });
  noPerms.forEach(a => {
    suggestions.push({
      icon: Shield, border: 'border-l-red-400',
      text: `${a.name} has no guardrails -- add permissions`,
      action: () => navigate(`/agents/${a.id}`),
    });
  });
  bgUnsafe.forEach(a => {
    if (!noPerms.find(n => n.id === a.id)) {
      suggestions.push({
        icon: RefreshCw, border: 'border-l-amber-400',
        text: `${a.name} runs in background without approval rules`,
        action: () => navigate(`/agents/${a.id}`),
      });
    }
  });
  if (summaries.length === 0 && !agentsLoading) {
    suggestions.push({
      icon: Plus, border: 'border-l-blue-400',
      text: 'Create your first agent to get started',
      action: () => navigate('/templates'),
    });
  }

  const pulseMessage = () => {
    if (agentsLoading) return { text: 'Loading...', mood: 'neutral' as const };
    if (summaries.length === 0) return { text: 'Office is empty -- create an agent to begin.', mood: 'neutral' as const };
    if (attention.length > 0) return { text: `${attention.length} agent${attention.length !== 1 ? 's' : ''} waiting on you.`, mood: 'attention' as const };
    if (active.length > 0) return { text: `${active.length} agent${active.length !== 1 ? 's' : ''} working. Everything's running.`, mood: 'working' as const };
    return { text: 'All quiet. Your agents are standing by.', mood: 'calm' as const };
  };

  const pulse = pulseMessage();
  const pulseDotColor = {
    neutral: 'bg-muted-foreground/40',
    attention: 'bg-amber-400 animate-pulse',
    working: 'bg-emerald-400 animate-pulse',
    calm: 'bg-emerald-400',
  }[pulse.mood];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Home</h1>
          <p className="text-sm text-muted-foreground">Your office at a glance</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
          <Settings className="w-4 h-4" /> Settings
        </Button>
      </div>

      {/* Pulse banner */}
      <div className="p-5 bg-card border border-border rounded-2xl mb-6">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pulseDotColor}`} />
          <p className="text-sm font-medium text-foreground">{pulse.text}</p>
        </div>
        <div className="flex items-center gap-4 mt-3 pl-[22px] text-[11px] text-muted-foreground">
          <span>{summaries.length} agent{summaries.length !== 1 ? 's' : ''}</span>
          <span className="text-border">.</span>
          <span>{active.length} active</span>
          {reviewFindings.length > 0 && (
            <>
              <span className="text-border">.</span>
              <span className="text-amber-500">{reviewFindings.length} issue{reviewFindings.length !== 1 ? 's' : ''}</span>
            </>
          )}
          {connectionStatus === 'disconnected' && (
            <>
              <span className="text-border">.</span>
              <span className="text-muted-foreground/60">Backend unreachable</span>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="Agents" value={summaries.length} tint="bg-primary/8 text-primary" onClick={() => navigate('/agents')} />
        <StatCard icon={Zap} label="Active" value={active.length} tint="bg-emerald-500/8 text-emerald-600" onClick={() => navigate('/agents?filter=active')} />
        <StatCard icon={AlertTriangle} label="Attention" value={attention.length} tint={attention.length > 0 ? 'bg-amber-500/8 text-amber-600' : 'bg-muted text-muted-foreground'} onClick={() => navigate('/agents?filter=attention')} />
        <StatCard icon={Shield} label="Issues" value={reviewFindings.length} tint={reviewFindings.length > 0 ? 'bg-red-500/8 text-red-600' : 'bg-muted text-muted-foreground'} onClick={() => navigate('/activity')} />
      </div>

      {/* Suggested actions */}
      <section className="mb-6">
        <h2 className="font-display font-semibold text-sm text-foreground mb-3">Suggested Actions</h2>
        {suggestions.length > 0 ? (
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={s.action}
                className={`group w-full flex items-center gap-3 p-3 bg-card border border-border ${s.border} border-l-[3px] rounded-xl hover:shadow-sm transition-all text-left`}
              >
                <s.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-foreground flex-1">{s.text}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl border border-border bg-card">
            <p className="text-sm text-muted-foreground">All clear -- nothing needs your attention right now.</p>
          </div>
        )}
      </section>

      {/* Connection status */}
      {connectionStatus === 'disconnected' && (
        <div className="p-4 border border-border rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Backend service not reachable</p>
            <p className="text-xs text-muted-foreground">Start the backend at localhost:5174 to manage agents.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4" /> Set up
          </Button>
        </div>
      )}
      {connectionStatus === 'connected' && (
        <p className="text-[11px] text-muted-foreground/50 text-center">Connected to local backend</p>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, tint, onClick }: {
  icon: React.ElementType; label: string; value: number; tint: string; onClick: () => void;
}) => (
  <button onClick={onClick} className="p-4 bg-card border border-border rounded-2xl text-left hover:shadow-sm transition-shadow">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${tint}`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </button>
);

export default FrontDeskPage;
