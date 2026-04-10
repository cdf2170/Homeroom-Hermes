import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Building2, Users, AlertTriangle, ArrowRight, Sparkles, Shield,
  RefreshCw, HelpCircle, Settings, Plus, CheckCircle2, Info,
  Cpu, Cloud, Zap, Clock, ClipboardCheck,
} from 'lucide-react';
import api from '@/services/mockApi';
import { getPendingCount } from '@/store/approvalStore';

const FrontDeskPage: React.FC = () => {
  const agents = api.useAgents();
  const navigate = useNavigate();
  const summaries = api.listAgents();
  const findings = api.getTrustFindings();
  const health = api.getRuntimeHealth();

  const active = summaries.filter(a => a.state === 'working' || a.state === 'walking');
  const attention = summaries.filter(a => a.needsAttention);
  const noPerms = summaries.filter(a => !a.hasPermissions && a.enabled);
  const bgUnsafe = summaries.filter(a => a.backgroundEnabled && !a.hasPermissions);
  const reviewFindings = findings.filter(f => f.severity === 'review' || f.severity === 'risky');

  // Build suggested actions
  const suggestions: { icon: React.ElementType; text: string; action: () => void; accent?: string }[] = [];

  attention.forEach(a => {
    suggestions.push({
      icon: AlertTriangle, accent: 'text-status-waiting',
      text: `${a.name} needs your input`,
      action: () => navigate(`/agents/${a.id}`),
    });
  });
  noPerms.forEach(a => {
    suggestions.push({
      icon: Shield, accent: 'text-status-waiting',
      text: `${a.name} has no guardrails — add permissions`,
      action: () => navigate(`/agents/${a.id}`),
    });
  });
  bgUnsafe.forEach(a => {
    if (!noPerms.find(n => n.id === a.id)) {
      suggestions.push({
        icon: RefreshCw,
        text: `${a.name} runs in background without approval rules`,
        action: () => navigate(`/agents/${a.id}`),
      });
    }
  });
  if (summaries.length === 0) {
    suggestions.push({
      icon: Plus,
      text: 'Create your first agent to get started',
      action: () => navigate('/templates'),
    });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Front Desk</h1>
          <p className="text-sm text-muted-foreground">Your office at a glance</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
          <Settings className="w-4 h-4" /> Settings
        </Button>
      </div>

      {/* Welcome summary */}
      <div className="p-5 bg-card border border-border rounded-xl mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {summaries.length === 0
                ? 'Your office is empty. Create an agent to get started.'
                : `${summaries.length} agent${summaries.length !== 1 ? 's' : ''} in your office. ${active.length} working right now.`}
              {attention.length > 0 && ` ${attention.length} need${attention.length === 1 ? 's' : ''} your input.`}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${health.serviceMode === 'demo' ? 'bg-status-waiting' : 'bg-status-working'}`} />
                {health.serviceMode === 'demo' ? 'Demo mode' : 'Connected'}
              </span>
              {health.cloudProvidersConnected.length > 0 && (
                <span className="flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> {health.cloudProvidersConnected.length} provider{health.cloudProvidersConnected.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard icon={Users} label="Agents" value={summaries.length} onClick={() => navigate('/agents')} />
        <StatCard icon={Zap} label="Active" value={active.length} accent={active.length > 0 ? 'working' : undefined} onClick={() => navigate('/agents?filter=active')} />
        <StatCard icon={ClipboardCheck} label="Approvals" value={getPendingCount()} accent={getPendingCount() > 0 ? 'attention' : undefined} onClick={() => navigate('/approvals')} />
        <StatCard icon={AlertTriangle} label="Attention" value={attention.length} accent={attention.length > 0 ? 'attention' : undefined} onClick={() => navigate('/agents?filter=attention')} />
        <StatCard icon={Shield} label="Issues" value={reviewFindings.length} accent={reviewFindings.length > 0 ? 'attention' : undefined} onClick={() => navigate('/trust')} />
      </div>

      {/* Suggested actions */}
      {suggestions.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display font-semibold text-sm text-foreground mb-3">Suggested Actions</h2>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={s.action}
                className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-shadow text-left"
              >
                <s.icon className={`w-4 h-4 shrink-0 ${s.accent || 'text-primary'}`} />
                <span className="text-sm text-foreground flex-1">{s.text}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Explainer cards */}
      <section>
        <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-muted-foreground" /> How things work
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          <ExplainerCard
            icon={RefreshCw}
            title="What does 'runs in background' mean?"
            body="A background agent can work even when you're not watching. It follows its schedule and acts on its own. Make sure you've set permissions and approval rules first."
          />
          <ExplainerCard
            icon={Shield}
            title="What are guardrails?"
            body="Guardrails define what an agent can and can't do — like which tools it can use, whether it can access the internet, and what needs your approval before acting."
          />
          <ExplainerCard
            icon={Cpu}
            title="Local vs Cloud"
            body="Local agents run models on your device — fully private, works offline. Cloud agents use external AI providers — more powerful, but data leaves your machine."
          />
          <ExplainerCard
            icon={Clock}
            title="How do schedules work?"
            body="You can set agents to run on a schedule — every morning, every few hours, or on a custom pattern. They'll check in and report back based on your settings."
          />
        </div>
      </section>

      {/* Setup CTA */}
      {health.serviceMode === 'demo' && (
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Not connected to a backend yet</p>
            <p className="text-xs text-muted-foreground">Set up models and connections to make your agents do real work.</p>
          </div>
          <Button size="sm" onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4" /> Set up
          </Button>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent, onClick }: {
  icon: React.ElementType; label: string; value: number; accent?: string; onClick: () => void;
}) => (
  <button onClick={onClick} className="p-4 bg-card border border-border rounded-xl text-left hover:shadow-sm transition-shadow">
    <Icon className={`w-4 h-4 mb-2 ${accent === 'attention' ? 'text-status-waiting' : accent === 'working' ? 'text-status-working' : 'text-muted-foreground'}`} />
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </button>
);

const ExplainerCard = ({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) => (
  <div className="p-4 bg-card border border-border rounded-xl">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-primary" />
      <p className="text-xs font-semibold text-foreground">{title}</p>
    </div>
    <p className="text-[11px] text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

export default FrontDeskPage;
