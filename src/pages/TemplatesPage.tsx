import React, { useState } from 'react';
import { agentTemplates } from '@/data/mockAgents';
import { STARTER_AGENTS, StarterAgent } from '@/data/starterPack';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useAgents, useCreateAgent } from '@/hooks/api/useAgents';
import { backendApi } from '@/services/backendApi';
import { Sparkles, ArrowRight, Check, Search, Calendar, ClipboardList, MessageSquare, Settings, Target, CheckCircle2, Loader2 } from 'lucide-react';
import { AgentTemplate } from '@/types/agent';
import { toast } from 'sonner';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  search: Search,
  calendar: Calendar,
  clipboard: ClipboardList,
  message: MessageSquare,
  settings: Settings,
  target: Target,
};

// ── Starter Agent Card ──

const StarterCard: React.FC<{
  starter: StarterAgent;
  isActive: boolean;
  isLoading: boolean;
  onActivate: () => void;
}> = ({ starter, isActive, isLoading, onActivate }) => {
  const Icon = starter.icon;

  return (
    <div
      className={`p-5 rounded-xl border-2 transition-all ${
        isActive
          ? 'border-status-working/30 bg-status-working/5'
          : 'border-border bg-card hover:border-muted-foreground/20 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
          style={{ backgroundColor: starter.avatarColor }}
        >
          {starter.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-foreground text-base leading-tight">{starter.name}</h3>
            <span className="text-xs text-muted-foreground">{starter.tagline}</span>
          </div>
          {starter.recommended && !isActive && (
            <Badge variant="default" className="text-[10px] mt-1 bg-primary/10 text-primary border-none">
              {starter.badgeText}
            </Badge>
          )}
          {isActive && (
            <Badge variant="default" className="text-[10px] mt-1 bg-status-working/15 text-status-working border-none">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Active
            </Badge>
          )}
        </div>
      </div>

      <Badge variant="secondary" className="text-[10px] mb-2">{starter.tag}</Badge>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{starter.description}</p>

      {isActive ? (
        <Button size="sm" variant="outline" className="w-full text-xs" disabled>
          <CheckCircle2 className="w-3.5 h-3.5" /> Already in your office
        </Button>
      ) : (
        <Button size="sm" className="w-full text-xs" onClick={onActivate} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
          {isLoading ? 'Adding...' : `Activate ${starter.name}`}
        </Button>
      )}
    </div>
  );
};

// ── Main Page ──

const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: agents = [] } = useAgents();
  const createAgent = useCreateAgent();
  const [selected, setSelected] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  const agentNames = new Set(agents.map(a => a.name.toLowerCase()));

  const handleActivateStarter = async (starter: StarterAgent) => {
    if (activating) return;
    setActivating(starter.id);
    try {
      const created = await createAgent.mutateAsync({
        name: starter.name,
        purpose: starter.agentConfig.purpose,
        smartnessLevel: starter.agentConfig.smartnessLevel,
        runtimeMode: starter.agentConfig.runtimeMode,
      });
      // Patch additional profile fields
      await backendApi.updateAgent(created.id, {
        role: starter.agentConfig.role,
        instructions: starter.agentConfig.personality ?? '',
        archetype: starter.agentConfig.archetype,
        vibe: starter.agentConfig.vibe,
      });
      toast.success(`${starter.name} has joined your office.`);
      navigate(`/agents/${created.id}`);
    } catch {
      // error toast shown by mutation
    } finally {
      setActivating(null);
    }
  };

  const handleSelect = (template: AgentTemplate) => {
    setSelected(template.id);
    setTimeout(() => navigate(`/create-agent?template=${template.id}`), 600);
  };

  const handleCustom = () => {
    setSelected('custom');
    setTimeout(() => navigate('/create-agent'), 600);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto pb-16">
      {/* Page header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
          Add an Agent
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
          Activate a pre-built agent instantly, or build one from scratch.
        </p>
      </div>

      {/* ── Starter Pack ── */}
      <section className="mb-10">
        <div className="mb-5">
          <h2 className="font-display font-bold text-lg text-foreground mb-1">
            Your starter team &mdash; ready on day one
          </h2>
          <p className="text-sm text-muted-foreground">
            These agents come pre-configured. Just activate them and they&apos;re good to go. You can customize anything later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STARTER_AGENTS.map(starter => (
            <StarterCard
              key={starter.id}
              starter={starter}
              isActive={agentNames.has(starter.name.toLowerCase())}
              isLoading={activating === starter.id}
              onActivate={() => handleActivateStarter(starter)}
            />
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative mb-10">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs text-muted-foreground font-medium">
          or build your own
        </span>
      </div>

      {/* ── Template Picker ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {agentTemplates.map(template => {
          const Icon = TEMPLATE_ICONS[template.icon] || Sparkles;
          return (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              disabled={selected !== null}
              className={`group text-left p-5 bg-card border rounded-xl transition-all duration-200 ${
                selected === template.id
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:shadow-md'
              } ${selected !== null && selected !== template.id ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-foreground text-base leading-tight">{template.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{template.summary}</p>
                </div>
                {selected === template.id && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>

              <Badge variant="secondary" className="text-[10px] mb-3">{template.idealFor}</Badge>

              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{template.helpsWith}</p>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Example tasks</p>
                {template.exampleTasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-muted-foreground/50 text-xs mt-px">&bull;</span>
                    <span className="text-xs text-muted-foreground leading-snug">{task}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Start with this <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}

        <button
          onClick={handleCustom}
          disabled={selected !== null}
          className={`group text-left p-5 border-2 border-dashed rounded-xl transition-all duration-200 ${
            selected === 'custom'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-accent/30'
          } ${selected !== null && selected !== 'custom' ? 'opacity-50' : ''}`}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-foreground text-base leading-tight">Create Custom</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Build a teammate from scratch, your way</p>
            </div>
            {selected === 'custom' && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Have something specific in mind? Start from a blank slate and describe what
            you need in your own words.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Start from scratch <ArrowRight className="w-3 h-3" />
          </div>
        </button>
      </div>

      {selected && (
        <div className="text-center py-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-medium text-primary flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Great choice! Setting things up...
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/50 rounded-xl text-center max-w-lg mx-auto">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium">No pressure.</span> You can start with any template and
          edit everything later — name, role, personality, permissions, all of it.
          Start simple. You can&apos;t break anything.
        </p>
      </div>
    </div>
  );
};

export default TemplatesPage;
