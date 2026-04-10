import React, { useState } from 'react';
import { agentTemplates } from '@/data/mockAgents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Check, Search, Calendar, ClipboardList, MessageSquare, Settings, Target } from 'lucide-react';
import { AgentTemplate } from '@/types/agent';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  search: Search,
  calendar: Calendar,
  clipboard: ClipboardList,
  message: MessageSquare,
  settings: Settings,
  target: Target,
};

const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

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
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
          Choose a Starting Template
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
          Pick a role that fits what you need help with. You can change everything later.
        </p>
      </div>

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
          Start simple. You can't break anything.
        </p>
      </div>
    </div>
  );
};

export default TemplatesPage;
