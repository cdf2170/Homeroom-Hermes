import React from 'react';
import { useAgents } from '@/store/agentStore';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ShieldCheck, ShieldAlert, Cpu, Cloud, Eye, Lock,
  AlertTriangle, CheckCircle2, ArrowRight, Key, Globe, Wrench,
  RefreshCw, Clock, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModelStore, hasProviderKey } from '@/store/modelConfigStore';
import { Agent } from '@/types/agent';
import StateCoverage from '@/components/StateCoverage';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';

const timeAgo = (date: Date) => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ── Risk analysis ──

interface Finding {
  id: string;
  level: 'ok' | 'info' | 'warning' | 'risk';
  title: string;
  detail: string;
  agentId?: string;
  agentName?: string;
}

function analyzeRisks(agents: Agent[]): Finding[] {
  const findings: Finding[] = [];

  // Global checks
  const cloudAgents = agents.filter(a => a.runtimeMode === 'cloud' || a.runtimeMode === 'hybrid');
  const bgAgents = agents.filter(a => a.backgroundEnabled);
  const noPermsAgents = agents.filter(a => !a.permissions && a.enabled);

  if (cloudAgents.length > 0) {
    findings.push({
      id: 'cloud-agents',
      level: 'info',
      title: `${cloudAgents.length} agent${cloudAgents.length > 1 ? 's' : ''} use cloud models`,
      detail: 'These agents send data to external AI providers. Make sure you trust the provider.',
    });
  }

  if (bgAgents.length > 0) {
    findings.push({
      id: 'bg-agents',
      level: 'info',
      title: `${bgAgents.length} agent${bgAgents.length > 1 ? 's' : ''} can run in the background`,
      detail: 'Background agents can work without you watching. Review their schedules and permissions.',
    });
  }

  // Per-agent checks
  agents.forEach(a => {
    if (!a.permissions && a.enabled) {
      findings.push({
        id: `no-perms-${a.id}`, level: 'warning', agentId: a.id, agentName: a.name,
        title: `${a.name} has no guardrails set`,
        detail: 'This agent has no explicit permission boundaries. Consider adding rules and tool limits.',
      });
    }

    if (a.permissions?.networkAccess && a.runtimeMode === 'local') {
      findings.push({
        id: `net-local-${a.id}`, level: 'info', agentId: a.id, agentName: a.name,
        title: `${a.name} has internet access but runs locally`,
        detail: 'It can still reach external services even though the model runs on your device.',
      });
    }

    if (a.permissions?.toolScopes && a.permissions.toolScopes.length > 5) {
      findings.push({
        id: `broad-tools-${a.id}`, level: 'warning', agentId: a.id, agentName: a.name,
        title: `${a.name} has broad tool access (${a.permissions.toolScopes.length} tools)`,
        detail: 'Consider limiting to only the tools this agent actually needs.',
      });
    }

    if (a.backgroundEnabled && (!a.permissions || a.permissions.requiresApprovalFor.length === 0)) {
      findings.push({
        id: `bg-no-approval-${a.id}`, level: 'warning', agentId: a.id, agentName: a.name,
        title: `${a.name} runs in background with no approval requirements`,
        detail: 'Background agents without approval gates can act fully autonomously.',
      });
    }

    if (a.ruleItems.length === 0 && a.enabled) {
      findings.push({
        id: `no-rules-${a.id}`, level: 'info', agentId: a.id, agentName: a.name,
        title: `${a.name} has no explicit rules`,
        detail: 'Adding rules helps keep agent behavior predictable and safe.',
      });
    }
  });

  // If nothing found
  if (findings.length === 0) {
    findings.push({
      id: 'all-good', level: 'ok',
      title: 'Everything looks good',
      detail: 'No issues detected. Your agents are configured safely.',
    });
  }

  return findings;
}

// ── Main Page ──

const TrustCenterPage: React.FC = () => {
  const agents = useAgents();
  const navigate = useNavigate();
  const modelStore = useModelStore();
  const loading = useSimulatedLoading(500);

  const findings = analyzeRisks(agents);
  const warnings = findings.filter(f => f.level === 'warning' || f.level === 'risk');
  const infos = findings.filter(f => f.level === 'info');
  const allGood = warnings.length === 0;

  const localAgents = agents.filter(a => a.runtimeMode === 'local');
  const cloudAgents = agents.filter(a => a.runtimeMode === 'cloud' || a.runtimeMode === 'hybrid');
  const bgAgents = agents.filter(a => a.backgroundEnabled);

  // Recent config-related activities
  const recentEvents = agents
    .flatMap(a => a.activities.map(act => ({ ...act, agentName: a.name, agentId: a.id, agentColor: a.appearance.outfitColor })))
    .filter(act => ['State Change', 'Created', 'Permission', 'Config'].some(k => act.action.includes(k)) || act.detail.toLowerCase().includes('permission') || act.detail.toLowerCase().includes('safety') || act.detail.toLowerCase().includes('rule'))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <StateCoverage loading={loading} loadingRows={6}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Trust Center</h1>
          <p className="text-sm text-muted-foreground">See exactly what your agents can do and why you're safe</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          allGood ? 'bg-status-working/10 text-status-working' : 'bg-status-waiting/10 text-status-waiting'
        }`}>
          {allGood ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          {allGood ? 'All clear' : `${warnings.length} item${warnings.length > 1 ? 's' : ''} to review`}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <OverviewCard icon={Shield} label="Overall Status" value={allGood ? 'Safe' : 'Review Needed'} accent={allGood ? 'ok' : 'warning'} />
        <OverviewCard icon={Cpu} label="Local Agents" value={localAgents.length} />
        <OverviewCard icon={Cloud} label="Cloud Agents" value={cloudAgents.length} />
        <OverviewCard icon={RefreshCw} label="Background Agents" value={bgAgents.length} />
      </div>

      {/* Risk Checks */}
      {warnings.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-waiting" /> Needs attention
          </h2>
          <div className="space-y-2">
            {warnings.map(f => (
              <FindingCard key={f.id} finding={f} onNavigate={f.agentId ? () => navigate(`/agents/${f.agentId}`) : undefined} />
            ))}
          </div>
        </section>
      )}

      {infos.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" /> Good to know
          </h2>
          <div className="space-y-2">
            {infos.map(f => (
              <FindingCard key={f.id} finding={f} onNavigate={f.agentId ? () => navigate(`/agents/${f.agentId}`) : undefined} />
            ))}
          </div>
        </section>
      )}

      {allGood && infos.length === 0 && (
        <div className="p-6 bg-status-working/5 border border-status-working/20 rounded-xl text-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-status-working mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Everything looks safe</p>
          <p className="text-xs text-muted-foreground mt-1">All agents have appropriate permissions and boundaries.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Agent Permissions Overview */}
        <section>
          <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" /> Agent Permissions
          </h2>
          <div className="space-y-2">
            {agents.map(a => (
              <button
                key={a.id}
                onClick={() => navigate(`/agents/${a.id}`)}
                className="w-full p-3 bg-card border border-border rounded-xl text-left hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ backgroundColor: a.appearance.outfitColor }}>
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
                  <PermChip icon={a.runtimeMode === 'local' ? Cpu : Cloud} label={a.runtimeMode === 'local' ? 'Local' : 'Cloud'} />
                  <PermChip icon={a.backgroundEnabled ? RefreshCw : Clock} label={a.backgroundEnabled ? 'Background' : 'Manual'} />
                  {a.permissions?.networkAccess && <PermChip icon={Globe} label="Internet" />}
                  {a.permissions?.toolScopes?.slice(0, 2).map(t => <PermChip key={t} icon={Wrench} label={t} />)}
                  {(a.permissions?.toolScopes?.length || 0) > 2 && (
                    <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">+{(a.permissions?.toolScopes?.length || 0) - 2}</span>
                  )}
                </div>
              </button>
            ))}
            {agents.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No agents yet</p>
            )}
          </div>
        </section>

        {/* Secrets & Connections */}
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
                Keys are never shown to agents or included in prompts. They're only used to connect to model providers.
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
              <p className="text-xs font-semibold text-foreground mb-1.5">Cloud model connections</p>
              <div className="space-y-1">
                {['openai', 'anthropic', 'google'].map(provider => (
                  <div key={provider} className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground capitalize">{provider}</span>
                    <span className={`font-medium ${hasProviderKey(provider) ? 'text-status-working' : 'text-muted-foreground'}`}>
                      {hasProviderKey(provider) ? 'Connected' : 'Not set'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Security Events */}
          <h2 className="font-display font-semibold text-sm text-foreground mb-3 mt-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" /> Recent Changes
          </h2>
          <div className="space-y-0.5">
            {recentEvents.length > 0 ? recentEvents.map(evt => (
              <div key={evt.id} className="flex items-start gap-2 p-2 text-xs rounded-lg hover:bg-muted/50">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground shrink-0 mt-0.5" style={{ backgroundColor: evt.agentColor }}>
                  {evt.agentName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{evt.agentName}</span>{' '}
                  <span className="text-muted-foreground">{evt.detail}</span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(evt.timestamp)}</span>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground text-center py-4">No recent security-related events</p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">How Homeroom keeps you safe:</span> All agents have explicit permission boundaries. Cloud connections are opt-in. Background agents require your approval. API keys are never exposed to agents or shown in outputs. You can review every action in the activity log.
        </p>
      </div>
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

const FindingCard = ({ finding, onNavigate }: { finding: Finding; onNavigate?: () => void }) => (
  <div className={`p-3 rounded-xl border flex items-start gap-3 ${
    finding.level === 'warning' || finding.level === 'risk'
      ? 'bg-status-waiting/5 border-status-waiting/20'
      : 'bg-card border-border'
  }`}>
    {finding.level === 'warning' || finding.level === 'risk'
      ? <AlertTriangle className="w-4 h-4 text-status-waiting shrink-0 mt-0.5" />
      : <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
    }
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-foreground">{finding.title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{finding.detail}</p>
    </div>
    {onNavigate && (
      <button onClick={onNavigate} className="text-xs text-primary hover:underline flex items-center gap-0.5 shrink-0">
        Review <ArrowRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

const PermChip = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <span className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">
    <Icon className="w-2.5 h-2.5" /> {label}
  </span>
);

export default TrustCenterPage;
