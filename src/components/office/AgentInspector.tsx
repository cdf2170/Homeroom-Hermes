import React, { useState } from 'react';
import AvatarPreview from '@/components/AvatarPreview';
import {
  X, Play, Pause, Trash2, Clock, Zap, Target,
  AlertTriangle, Shield, Cpu, Cloud, Pencil, Check,
  Power, PowerOff, Eye, ChevronDown, ChevronUp, User, Palette,
  Brain, Lock, Activity, FileText, Sparkles, Settings, Users, Wrench,
  Database, Info, MessageSquare, Calendar, FolderOpen,
} from 'lucide-react';
import {
  Agent, STATE_LABELS, AgentState, OfficeZone,
  AgentAppearance, SmartLevel, RuntimeMode,
  CheckInFrequency, EscalationBehavior, TaskStyle, ROOM_BOUNDS,
} from '@/types/agent';
import { AI_MODELS, COST_LABELS, PROVIDERS, AIModel, PROVIDER_INFO } from '@/data/models';
import {
  useModelStore, getAgentModel, setAgentModel, toggleFavorite, isFavorite,
  addCustomModel, hasProviderKey, setProviderKey, removeProviderKey,
} from '@/store/modelConfigStore';
import { useCredentials, useSaveCredential, useDeleteCredential, useLocalModels } from '@/hooks/api/useAgents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { updateAgent, removeAgent } from '@/store/agentStore';
import { useUpdateAgent, useDeleteAgent } from '@/hooks/api/useAgents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface AgentInspectorProps {
  agent: Agent;
  onClose: () => void;
}

// ── Helpers ──

const stateColor = (state: string) => {
  switch (state) {
    case 'working': return 'bg-status-working';
    case 'on-break': return 'bg-status-break';
    case 'waiting': case 'needs-attention': return 'bg-status-waiting';
    case 'sleeping': case 'offline': return 'bg-status-offline';
    default: return 'bg-status-idle';
  }
};

const stateIcon = (state: string) => {
  switch (state) {
    case 'working': return <Zap className="w-3 h-3" />;
    case 'waiting': case 'needs-attention': return <AlertTriangle className="w-3 h-3" />;
    case 'on-break': return <Clock className="w-3 h-3" />;
    default: return <Target className="w-3 h-3" />;
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

// ── Appearance constants ──

const SKIN_TONES = ['#FDDBB4', '#F1C27D', '#D2A679', '#8D5524', '#6B3A2A', '#3B1F0B'];
const HAIR_COLORS = ['#1A1A1A', '#3B2716', '#A0522D', '#D4A44C', '#C0392B', '#8E44AD', '#F5F5DC'];
const OUTFIT_COLORS = ['#5B8C5A', '#C06030', '#4A6FA5', '#9B59B6', '#2C3E50', '#E67E22', '#E74C3C', '#1ABC9C', '#F39C12', '#34495E'];
const BODY_TYPES: AgentAppearance['bodyType'][] = ['masculine', 'feminine'];
const HAIR_STYLES: AgentAppearance['hairStyle'][] = ['short', 'long', 'curly', 'buzz', 'ponytail', 'bun', 'mohawk', 'braids', 'wavy', 'afro', 'shaved'];
const OUTFIT_STYLES: AgentAppearance['outfitStyle'][] = ['casual', 'formal', 'sporty', 'techy', 'creative', 'cozy'];
const GLASSES: AgentAppearance['glasses'][] = ['none', 'round', 'square', 'aviator'];
const HEADWEAR: AgentAppearance['headwear'][] = ['none', 'cap', 'beanie', 'headband', 'beret'];
const ACCESSORIES: AgentAppearance['accessories'][number][] = ['none', 'headphones', 'scarf', 'watch', 'necklace', 'earbuds'];

// ── Tiny sub-components ──

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{children}</p>
);

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-2 py-1">
    <span className="text-xs text-muted-foreground shrink-0">{label}</span>
    <div className="text-right">{children}</div>
  </div>
);

const ColorDot = ({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) => (
  <button
    className={`w-5 h-5 rounded-full border-2 transition-all ${selected ? 'border-primary scale-110' : 'border-transparent hover:border-muted-foreground/30'}`}
    style={{ backgroundColor: color }}
    onClick={onClick}
  />
);

const ChipSelect = <T extends string>({ options, value, onChange, labels }: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<T, string>;
}) => (
  <div className="flex flex-wrap gap-1">
    {options.map(opt => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors capitalize ${
          value === opt ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
        }`}
      >
        {labels?.[opt] || opt}
      </button>
    ))}
  </div>
);

// ── Inline API Key Setup ──

const ProviderKeySetup: React.FC<{
  provider: string;
  onComplete: () => void;
  onCancel: () => void;
}> = ({ provider, onComplete, onCancel }) => {
  const info = PROVIDER_INFO[provider];
  const [key, setLocalKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const saveCred = useSaveCredential();
  const deleteCred = useDeleteCredential();
  const { data: credentials = [] } = useCredentials();
  const existingCred = credentials.find(c => c.provider === provider);

  if (!info) {
    return (
      <div className="p-3 space-y-2">
        <p className="text-xs text-muted-foreground">No setup info for {provider}.</p>
        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={onCancel}>Back</Button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!key.trim()) return;
    try {
      await saveCred.mutateAsync({ provider, key: key.trim() });
      setProviderKey(provider, ''); // mark connected in UI cache
      toast.success(`${info.name} API key saved to encrypted storage`);
      onComplete();
    } catch {
      // error toast shown by mutation
    }
  };

  const maskedKey = existingCred?.masked ?? null;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-bold text-muted-foreground bg-background px-1.5 py-0.5 rounded">{info.icon}</span>
        <div>
          <p className="text-xs font-semibold text-foreground">Connect {info.name}</p>
          <p className="text-[10px] text-muted-foreground">One-time setup — takes about 30 seconds</p>
        </div>
      </div>

      <div className="space-y-2 bg-background rounded-lg p-2.5">
        <div className="flex gap-2">
          <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">1</span>
          <div>
            <p className="text-[11px] text-foreground font-medium">Get your API key</p>
            <p className="text-[10px] text-muted-foreground">{info.helpText}</p>
            <a href={info.keyUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-0.5">
              Open {info.name} dashboard &rarr;
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">2</span>
          <div className="flex-1">
            <p className="text-[11px] text-foreground font-medium">Paste it here</p>
            {existingKey ? (
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-[10px] text-muted-foreground font-mono">
                  <Shield className="w-3 h-3 text-status-working shrink-0" />
                  <span className="truncate">{maskedKey}</span>
                  <Check className="w-3 h-3 text-status-working shrink-0 ml-auto" />
                </div>
                <p className="text-[10px] text-status-working flex items-center gap-1"><Check className="w-3 h-3" /> Key already saved</p>
              </div>
            ) : (
              <div className="mt-1 relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={info.keyPlaceholder || 'Paste your API key'}
                  value={key}
                  onChange={e => setLocalKey(e.target.value)}
                  className="h-7 text-xs font-mono pr-8"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-1.5 px-1">
        <Lock className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[9px] text-muted-foreground">Your key is stored locally on this device. It never leaves your browser.</p>
      </div>

      <div className="flex gap-1.5">
        {existingCred ? (
          <>
            <Button size="sm" className="text-xs h-7 flex-1" onClick={onComplete}>
              <Check className="w-3 h-3" /> Already connected
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={async () => {
              try {
                await deleteCred.mutateAsync(provider);
                removeProviderKey(provider);
                setLocalKey('');
                toast.success('Key removed');
              } catch {}
            }}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <Button size="sm" className="text-xs h-7 flex-1" onClick={handleSave} disabled={!key.trim()}>
            <Check className="w-3 h-3" /> Save & continue
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

// ── Model Quick Switcher ──

const ModelQuickSwitcher: React.FC<{ agentId: string; agentName: string; initialModelRef?: string | null }> = ({ agentId, agentName, initialModelRef }) => {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customProvider, setCustomProvider] = useState('');
  const { data: credentials = [] } = useCredentials();
  const { data: localModelsData } = useLocalModels();
  const update = useUpdateAgent(agentId);

  // Prefer the backend-persisted modelRef; fall back to localStorage
  const backendModelId = initialModelRef ?? null;
  const localModelId = getAgentModel(agentId);
  const currentModelId = backendModelId || localModelId || null;
  const currentModel = AI_MODELS.find(m => m.id === currentModelId);
  const currentLocalModel = currentModelId && !currentModel ? localModelsData?.models.find(m => m.id === currentModelId) : null;
  const currentModelName = currentModel?.name ?? currentLocalModel?.name ?? currentModelId;
  const currentModelDesc = currentModel
    ? `${currentModel.provider} · ${COST_LABELS[currentModel.costTier]} · ${currentModel.contextWindow}`
    : currentLocalModel
    ? `Local · ${currentLocalModel.sizeGB}GB · ${currentLocalModel.parameterSize ?? currentLocalModel.tag}`
    : currentModelId ? 'Custom model' : 'Click to choose a model';

  // Build connected provider set from backend credentials + localStorage fallback
  const connectedProviders = new Set<string>([
    ...credentials.map(c => c.provider),
    ...AI_MODELS.map(m => m.provider).filter(p => hasProviderKey(p)),
  ]);

  const hasAnyProvider = connectedProviders.size > 0;
  const currentProviderConnected = currentModel ? connectedProviders.has(currentModel.provider) : false;

  const connectedModels = AI_MODELS.filter(m => connectedProviders.has(m.provider));
  const favoriteModels = connectedModels.filter(m => isFavorite(m.id));
  const allModels = connectedModels.filter(m =>
    !filter || m.name.toLowerCase().includes(filter.toLowerCase()) || m.provider.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSelect = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId);
    // Persist to backend
    update.mutate({ modelRef: modelId } as any);
    // Also keep localStorage in sync for offline/instant feedback
    setAgentModel(agentId, modelId);
    toast.success(`${agentName} now uses ${model?.name || modelId}`);
    setExpanded(false);
    setFilter('');
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const id = addCustomModel(customName, customProvider || 'Custom');
    update.mutate({ modelRef: id } as any);
    setAgentModel(agentId, id);
    toast.success(`Added and selected ${customName}`);
    setShowAddCustom(false);
    setCustomName('');
    setCustomProvider('');
  };

  return (
    <div className="space-y-2">
      <SectionLabel>Model</SectionLabel>
      <div className="bg-muted rounded-lg overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-2.5 flex items-center justify-between hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono font-bold text-muted-foreground">{currentLocalModel ? 'LC' : currentModel?.providerIcon || '---'}</span>
            <div className="text-left min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {currentModelName || 'No model selected'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {currentModelDesc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {currentModel && !currentProviderConnected && (
              <span className="text-[9px] text-status-waiting bg-status-waiting/10 px-1.5 py-0.5 rounded-full font-medium">No key</span>
            )}
            {currentModel && currentProviderConnected && (
              <span className="text-[9px] text-status-working bg-status-working/10 px-1.5 py-0.5 rounded-full font-medium">Connected</span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {currentModel && !currentProviderConnected && !expanded && (
          <a
            href="/settings"
            className="w-full px-3 py-2 bg-status-waiting/5 border-t border-status-waiting/20 flex items-center gap-2 text-left hover:bg-status-waiting/10 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-status-waiting shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-foreground">API key needed</p>
              <p className="text-[10px] text-muted-foreground">Connect {currentModel.provider} in Settings</p>
            </div>
          </a>
        )}

        {expanded && (
          <div className="border-t border-border">
            {!hasAnyProvider ? (
              <div className="p-4 text-center">
                <p className="text-xs font-medium text-foreground mb-1">No providers connected</p>
                <p className="text-[10px] text-muted-foreground mb-2">Connect an AI provider in Settings to choose a model.</p>
                <a href="/settings" className="text-[10px] text-primary hover:underline">Go to Settings</a>
              </div>
            ) : (
              <>
                <div className="p-2">
                  <Input
                    placeholder="Search models..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="h-7 text-xs bg-background"
                  />
                </div>

                <div className="max-h-[240px] overflow-y-auto">
                  {!filter && favoriteModels.length > 0 && (
                    <div className="px-2 pb-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">Favorites</p>
                      {favoriteModels.map(m => (
                        <ModelRow key={m.id} model={m} selected={m.id === currentModelId} onSelect={handleSelect} />
                      ))}
                    </div>
                  )}

                  {(filter ? [{ label: 'Results', models: allModels }] : PROVIDERS.map(p => ({
                    label: p,
                    models: allModels.filter(m => m.provider === p),
                  }))).filter(g => g.models.length > 0).map(group => (
                    <div key={group.label} className="px-2 pb-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1 mt-1">{group.label}</p>
                      {group.models.map(m => (
                        <ModelRow key={m.id} model={m} selected={m.id === currentModelId} onSelect={handleSelect} />
                      ))}
                    </div>
                  ))}

                  {/* Local Ollama models */}
                  {localModelsData?.ollamaRunning && localModelsData.models.length > 0 && (
                    <div className="px-2 pb-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1 mt-1 flex items-center gap-1">
                        <Cpu className="w-2.5 h-2.5" /> Local (Ollama)
                      </p>
                      {localModelsData.models
                        .filter(m => !filter || m.name.toLowerCase().includes(filter.toLowerCase()))
                        .map(m => (
                          <button
                            key={m.id}
                            onClick={() => handleSelect(m.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                              m.id === currentModelId ? 'bg-primary/10 text-primary' : 'hover:bg-accent/50'
                            }`}
                          >
                            <span className="text-[10px] font-mono font-bold text-emerald-600 w-6 text-center shrink-0">LC</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{m.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {m.sizeGB}GB · {m.parameterSize ?? m.tag} · Local
                              </p>
                            </div>
                            {m.id === currentModelId && <Check className="w-3 h-3 text-primary shrink-0" />}
                          </button>
                        ))}
                    </div>
                  )}

                  {allModels.length === 0 && (!localModelsData?.models.length) && filter && (
                    <p className="text-xs text-muted-foreground text-center py-3">No models match "{filter}"</p>
                  )}
                </div>
              </>
            )}

            <div className="border-t border-border p-2">
              {showAddCustom ? (
                <div className="space-y-1.5">
                  <Input placeholder="Model name (e.g. My Fine-tune)" value={customName} onChange={e => setCustomName(e.target.value)} className="h-7 text-xs" />
                  <Input placeholder="Provider (e.g. OpenAI)" value={customProvider} onChange={e => setCustomProvider(e.target.value)} className="h-7 text-xs" />
                  <div className="flex gap-1">
                    <Button size="sm" className="text-[10px] h-6 flex-1" onClick={handleAddCustom}><Check className="w-3 h-3" /> Add</Button>
                    <Button size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => setShowAddCustom(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCustom(true)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground py-1 flex items-center justify-center gap-1 transition-colors"
                >
                  <span className="text-sm">+</span> Add custom model
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Single model row ──

const ModelRow: React.FC<{
  model: AIModel;
  selected: boolean;
  onSelect: (id: string) => void;
}> = ({ model, selected, onSelect }) => {
  const fav = isFavorite(model.id);

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
        selected ? 'bg-primary/10 text-foreground' : 'hover:bg-accent/50 text-foreground'
      }`}
      onClick={() => onSelect(model.id)}
    >
      <span className="text-[10px] font-mono font-bold text-muted-foreground shrink-0">{model.providerIcon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-[11px] font-medium truncate">{model.name}</p>
          {selected && <Check className="w-3 h-3 text-primary shrink-0" />}
        </div>
        <p className="text-[9px] text-muted-foreground truncate">{model.description}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[9px] text-muted-foreground">{COST_LABELS[model.costTier]}</span>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(model.id); }}
          className={`p-0.5 rounded transition-colors ${fav ? 'text-yellow-500' : 'text-muted-foreground/30 opacity-0 group-hover:opacity-100'}`}
          title={fav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <span className="text-[10px]">{'\u2605'}</span>
        </button>
      </div>
    </div>
  );
};

// ── Collapsible Advanced Section ──

const AdvancedSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  syncLabel: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, syncLabel, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <div className="text-left">
            <p className="text-xs font-medium text-foreground">{title}</p>
            <p className="text-[9px] text-muted-foreground">{syncLabel}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2.5 pb-2.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

// ══════════════════════════════════════
// ── MAIN COMPONENT ──
// ══════════════════════════════════════

const AgentInspector: React.FC<AgentInspectorProps> = ({ agent, onClose }) => {
  const update = useUpdateAgent(agent.id);
  const deleteAgentMutation = useDeleteAgent();
  const [activeTab, setActiveTab] = useState('profile');

  const handleSetState = (state: AgentState) => {
    const zoneMap: Record<AgentState, OfficeZone> = {
      working: 'work', walking: 'work', idle: 'work',
      'on-break': 'lounge', waiting: 'approval', paused: 'work',
      offline: 'quiet', sleeping: 'quiet', 'needs-attention': 'approval',
    };
    update.mutate({
      state, zone: zoneMap[state],
      activities: [
        { id: `act-${Date.now()}`, timestamp: new Date(), action: 'State Change', detail: `Status changed to ${STATE_LABELS[state]}` },
        ...agent.activities,
      ],
    });
    toast.success(`${agent.name} is now ${STATE_LABELS[state].toLowerCase()}`);
  };

  const handleRunNow = () => {
    handleSetState('working');
    setActiveTab('trail');
  };

  const openMessageComposer = () => {
    setActiveTab('trail');
  };

  const openSchedulePanel = () => {
    setActiveTab('schedule');
  };

  const handleDelete = () => {
    deleteAgentMutation.mutate(agent.id);
    removeAgent(agent.id);
    onClose();
    toast.success(`${agent.name} has left the office`);
  };

  const isPaused = agent.state === 'paused';

  return (
    <div className="w-[340px] bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-5rem)]">
      {/* ── Header ── */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground shadow-sm relative shrink-0"
              style={{ backgroundColor: agent.appearance.outfitColor }}
            >
              {agent.name[0]}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${stateColor(agent.state)}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-foreground text-sm truncate">{agent.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full text-xs font-medium text-foreground">
            {stateIcon(agent.state)}
            {STATE_LABELS[agent.state]}
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground">
            {agent.runtimeMode === 'local' ? <Cpu className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
            {agent.runtimeMode === 'local' ? 'On device' : agent.runtimeMode === 'cloud' ? 'Online' : 'Both'}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => {
              const next = !agent.enabled;
              update.mutate({ enabled: next, state: next ? 'idle' : 'offline', zone: next ? 'work' : 'quiet' });
              toast.success(next ? `${agent.name} enabled` : `${agent.name} disabled`);
            }}
            className={`p-1 rounded-md transition-colors ${agent.enabled ? 'text-status-working hover:bg-muted' : 'text-muted-foreground hover:bg-muted'}`}
            title={agent.enabled ? 'Disable agent' : 'Enable agent'}
          >
            {agent.enabled ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-6 rounded-none border-b border-border bg-transparent h-9 shrink-0">
          {[
            { value: 'profile',   icon: <User className="w-3 h-3" />,      label: 'Profile'   },
            { value: 'brief',     icon: <FileText className="w-3 h-3" />,   label: 'Brief'     },
            { value: 'rules',     icon: <Shield className="w-3 h-3" />,     label: 'Rules'     },
            { value: 'schedule',  icon: <Clock className="w-3 h-3" />,      label: 'Schedule'  },
            { value: 'trail',     icon: <Activity className="w-3 h-3" />,   label: 'Trail'     },
            { value: 'workspace', icon: <FolderOpen className="w-3 h-3" />, label: 'Workspace' },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-[10px] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none gap-0.5 px-0.5"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto">

          {/* ════════════════════════════════════ */}
          {/* TAB: PROFILE */}
          {/* ════════════════════════════════════ */}
          <TabsContent value="profile" className="m-0 p-3 space-y-4">
            {agent.currentTask ? (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3 h-3 text-primary" />
                  <p className="text-[11px] text-muted-foreground font-semibold">Working on</p>
                </div>
                <p className="text-sm text-foreground">{agent.currentTask}</p>
                {agent.lastRunAt && (
                  <p className="text-[10px] text-muted-foreground mt-1">Started {timeAgo(agent.lastRunAt)}</p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-muted/50 rounded-lg border border-dashed border-border text-center">
                <p className="text-xs text-muted-foreground">No active task</p>
              </div>
            )}

            <div className="space-y-2">
              <SectionLabel>Identity</SectionLabel>
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1 pt-1">
                  <EditableField label="Name" value={agent.name} onSave={v => update.mutate({ name: v })} />
                  <EditableField label="Job title" value={agent.role} onSave={v => update.mutate({ role: v })} />
                </div>
                <div className="shrink-0">
                  <AvatarPreview appearance={agent.appearance} name={agent.name} size={64} />
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>Controls</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={openMessageComposer}>
                  <MessageSquare className="w-3 h-3" /> Message
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={openSchedulePanel}>
                  <Calendar className="w-3 h-3" /> Schedule
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-7 mt-1.5"
                onClick={() => handleSetState(isPaused ? 'working' : 'paused')}
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            </div>

            <ModelQuickSwitcher agentId={agent.id} agentName={agent.name} initialModelRef={(agent as any).modelRef} />

            <TaskAssigner agent={agent} />

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-lg font-bold text-foreground">{agent.runs.length}</p>
                <p className="text-[10px] text-muted-foreground">Runs</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-lg font-bold text-foreground">{agent.runs.filter(r => r.status === 'completed').length}</p>
                <p className="text-[10px] text-muted-foreground">Done</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-lg font-bold text-foreground">{agent.lastRunAt ? timeAgo(agent.lastRunAt) : '\u2014'}</p>
                <p className="text-[10px] text-muted-foreground">Last Run</p>
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════ */}
          {/* TAB: BRIEF — Purpose + Personality merged */}
          {/* ════════════════════════════════════ */}
          <TabsContent value="brief" className="m-0 p-3 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">What this agent does</p>
                <p className="text-[10px] text-muted-foreground">How it should operate and what good work looks like</p>
              </div>
            </div>

            <EditableField label="What they do" value={agent.purpose} onSave={v => update.mutate({ purpose: v })} multiline />
            <EditableField label="Instructions" value={agent.instructions} onSave={v => update.mutate({ instructions: v })} multiline placeholder="Tell this agent how to behave, what tone to use, and any special rules..." />

            <p className="text-[9px] text-muted-foreground/60 italic">Syncs with AGENTS.md</p>

            <div className="border-t border-border pt-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personality</p>
              <p className="text-[10px] text-muted-foreground mb-2">What you write here is what this agent becomes — the more specific, the better.</p>
              <EditableField label="" value={agent.personality} onSave={v => update.mutate({ personality: v })} multiline placeholder="Describe how this agent talks, thinks, and behaves. The more detail you give, the more consistent it'll be." />

              {/* Appearance */}
              <div className="pt-2 border-t border-border">
                <SectionLabel>Appearance</SectionLabel>
                <div className="flex justify-center py-2">
                  <AvatarPreview
                    appearance={agent.appearance}
                    name={agent.name}
                    size={96}
                    className="drop-shadow-sm"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <SectionLabel>Gender expression</SectionLabel>
                    <ChipSelect
                      options={BODY_TYPES}
                      value={agent.appearance.bodyType}
                      onChange={v => update.mutate({ appearance: { ...agent.appearance, bodyType: v } })}
                      labels={{
                        masculine: 'Masculine',
                        feminine: 'Feminine',
                      }}
                    />
                  </div>

                  <div>
                    <SectionLabel>Skin</SectionLabel>
                    <div className="flex gap-1.5 flex-wrap">
                      {SKIN_TONES.map(c => (
                        <ColorDot key={c} color={c} selected={agent.appearance.skinTone === c} onClick={() => update.mutate({ appearance: { ...agent.appearance, skinTone: c } })} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Hair style</SectionLabel>
                    <ChipSelect options={HAIR_STYLES} value={agent.appearance.hairStyle} onChange={v => update.mutate({ appearance: { ...agent.appearance, hairStyle: v } })} />
                  </div>

                  <div>
                    <SectionLabel>Hair color</SectionLabel>
                    <div className="flex gap-1.5 flex-wrap">
                      {HAIR_COLORS.map(c => (
                        <ColorDot key={c} color={c} selected={agent.appearance.hairColor === c} onClick={() => update.mutate({ appearance: { ...agent.appearance, hairColor: c } })} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Outfit</SectionLabel>
                    <ChipSelect options={OUTFIT_STYLES} value={agent.appearance.outfitStyle} onChange={v => update.mutate({ appearance: { ...agent.appearance, outfitStyle: v } })} />
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {OUTFIT_COLORS.map(c => (
                        <ColorDot key={c} color={c} selected={agent.appearance.outfitColor === c} onClick={() => update.mutate({ appearance: { ...agent.appearance, outfitColor: c } })} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Glasses</SectionLabel>
                    <ChipSelect options={GLASSES} value={agent.appearance.glasses} onChange={v => update.mutate({ appearance: { ...agent.appearance, glasses: v } })} />
                  </div>

                  <div>
                    <SectionLabel>Headwear</SectionLabel>
                    <ChipSelect options={HEADWEAR} value={agent.appearance.headwear} onChange={v => update.mutate({ appearance: { ...agent.appearance, headwear: v } })} />
                  </div>

                  <div>
                    <SectionLabel>Accessories</SectionLabel>
                    <ChipSelect
                      options={ACCESSORIES}
                      value={agent.appearance.accessories?.[0] || 'none'}
                      onChange={v => update.mutate({ appearance: { ...agent.appearance, accessories: [v] } })}
                    />
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-muted-foreground/60 italic mt-3">Syncs with SOUL.md</p>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════ */}
          {/* TAB: SCHEDULE */}
          {/* ════════════════════════════════════ */}
          <TabsContent value="schedule" className="m-0 p-3 space-y-4">
            <div>
              <SectionLabel>Where It Runs</SectionLabel>
              <FieldRow label="Location">
                <ChipSelect
                  options={['local', 'cloud', 'hybrid'] as RuntimeMode[]}
                  value={agent.runtimeMode}
                  onChange={v => update.mutate({ runtimeMode: v })}
                  labels={{ local: 'On device', cloud: 'Online', hybrid: 'Both' }}
                />
              </FieldRow>
              <FieldRow label="Intelligence">
                <ChipSelect
                  options={['basic', 'standard', 'advanced'] as SmartLevel[]}
                  value={agent.smartnessLevel}
                  onChange={v => update.mutate({ smartnessLevel: v })}
                />
              </FieldRow>
            </div>

            <div>
              <SectionLabel>Work style</SectionLabel>
              <FieldRow label="Task approach">
                <ChipSelect
                  options={['step-by-step', 'autonomous', 'collaborative'] as TaskStyle[]}
                  value={agent.taskStyle}
                  onChange={v => update.mutate({ taskStyle: v })}
                />
              </FieldRow>
              <FieldRow label="Background work">
                <Switch
                  checked={agent.backgroundEnabled}
                  onCheckedChange={v => update.mutate({ backgroundEnabled: v })}
                />
              </FieldRow>
              <FieldRow label="Default room">
                <Select value={agent.defaultRoom} onValueChange={(v: OfficeZone) => update.mutate({ defaultRoom: v })}>
                  <SelectTrigger className="h-6 text-xs w-28 border-none bg-muted"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(ROOM_BOUNDS).map(z => (
                      <SelectItem key={z} value={z} className="text-xs capitalize">{ROOM_BOUNDS[z as OfficeZone].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            </div>

            <div>
              <SectionLabel>Check-ins & escalation</SectionLabel>
              <FieldRow label="Check-in">
                <Select value={agent.checkInFrequency} onValueChange={(v: CheckInFrequency) => update.mutate({ checkInFrequency: v })}>
                  <SelectTrigger className="h-6 text-xs w-32 border-none bg-muted"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never" className="text-xs">Never</SelectItem>
                    <SelectItem value="hourly" className="text-xs">Every hour</SelectItem>
                    <SelectItem value="daily" className="text-xs">Once a day</SelectItem>
                    <SelectItem value="after-each-task" className="text-xs">After each task</SelectItem>
                    <SelectItem value="when-stuck" className="text-xs">Only when stuck</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="When stuck">
                <Select value={agent.escalationBehavior} onValueChange={(v: EscalationBehavior) => update.mutate({ escalationBehavior: v })}>
                  <SelectTrigger className="h-6 text-xs w-36 border-none bg-muted"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pause-and-wait" className="text-xs">Pause & wait for you</SelectItem>
                    <SelectItem value="retry-once" className="text-xs">Retry once, then pause</SelectItem>
                    <SelectItem value="notify-and-continue" className="text-xs">Notify & keep going</SelectItem>
                    <SelectItem value="ask-for-help" className="text-xs">Ask for help</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Notify on complete">
                <Switch checked={agent.notifyOnComplete} onCheckedChange={v => update.mutate({ notifyOnComplete: v })} />
              </FieldRow>
              <FieldRow label="Notify on error">
                <Switch checked={agent.notifyOnError} onCheckedChange={v => update.mutate({ notifyOnError: v })} />
              </FieldRow>
            </div>

            {agent.schedule && (
              <div className="p-2.5 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[11px] font-semibold text-muted-foreground">Schedule</p>
                </div>
                <p className="text-xs text-foreground">{agent.schedule.plainEnglish}</p>
              </div>
            )}
          </TabsContent>

          {/* ════════════════════════════════════ */}
          {/* TAB: TRAIL */}
          {/* ════════════════════════════════════ */}
          <TabsContent value="trail" className="m-0 p-3 space-y-4">
            {agent.runs.length > 0 && agent.runs[0].outputSummary && (
              <div className="p-2.5 bg-muted rounded-lg">
                <SectionLabel>Last output</SectionLabel>
                <p className="text-xs text-foreground">{agent.runs[0].outputSummary}</p>
              </div>
            )}

            <div>
              <SectionLabel>Run history</SectionLabel>
              <div className="space-y-1.5">
                {agent.runs.slice(0, 10).map(run => (
                  <div key={run.id} className="flex items-start gap-2 text-xs p-2 bg-muted/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                      run.status === 'completed' ? 'bg-status-working' :
                      run.status === 'running' ? 'bg-primary animate-pulse' :
                      run.status === 'failed' ? 'bg-destructive' : 'bg-muted-foreground'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate">{run.inputSummary}</p>
                      {run.outputSummary && <p className="text-muted-foreground mt-0.5 truncate">&rarr; {run.outputSummary}</p>}
                      {run.errorSummary && <p className="text-destructive mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {run.errorSummary}</p>}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-muted-foreground">{timeAgo(run.startedAt)}</span>
                        <span className="text-muted-foreground capitalize">{run.trigger}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {agent.runs.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-3">No runs yet — assign a task above</p>
                )}
              </div>
            </div>

            <div>
              <SectionLabel>Event log</SectionLabel>
              <div className="space-y-0.5">
                {agent.activities.slice(0, 15).map(act => (
                  <div key={act.id} className="flex gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground whitespace-nowrap shrink-0 w-12 text-right">{timeAgo(act.timestamp)}</span>
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">{act.action}</span>
                      <span className="text-muted-foreground ml-1">{act.detail}</span>
                    </div>
                  </div>
                ))}
                {agent.activities.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-3">No activity yet</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════ */}
          {/* TAB: RULES — Guardrails + USER.md + TOOLS.md + MEMORY.md */}
          {/* ════════════════════════════════════ */}
          <TabsContent value="rules" className="m-0 p-3 space-y-3">
            {/* Guardrails */}
            <AdvancedSection
              title="Guardrails"
              icon={<Shield className="w-4 h-4 text-primary" />}
              syncLabel="Safety level, tool & data access"
              defaultOpen={true}
            >
              {agent.permissions ? (
                <div className="space-y-3 mt-2">
                  <FieldRow label="Safety level">
                    <ChipSelect
                      options={['strict', 'moderate', 'autonomous'] as const}
                      value={agent.permissions.safetyLevel}
                      onChange={v => update.mutate({
                        permissions: { ...agent.permissions!, safetyLevel: v }
                      })}
                      labels={{ strict: 'Strict', moderate: 'Moderate', autonomous: 'Autonomous' }}
                    />
                  </FieldRow>

                  <div>
                    <SectionLabel>What tools it can use</SectionLabel>
                    <div className="flex flex-wrap gap-1">
                      {agent.permissions.toolScopes.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-muted rounded text-[10px] font-medium text-foreground">{t}</span>
                      ))}
                      {agent.permissions.toolScopes.length === 0 && <span className="text-[10px] text-muted-foreground italic">None configured yet</span>}
                    </div>
                  </div>

                  <div>
                    <SectionLabel>What data it can see</SectionLabel>
                    <div className="flex flex-wrap gap-1">
                      {agent.permissions.dataScopes.map(d => (
                        <span key={d} className="px-2 py-0.5 bg-muted rounded text-[10px] font-medium text-foreground">{d}</span>
                      ))}
                      {agent.permissions.dataScopes.length === 0 && <span className="text-[10px] text-muted-foreground italic">None configured yet</span>}
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Needs your OK for</SectionLabel>
                    <div className="flex flex-wrap gap-1">
                      {agent.permissions.requiresApprovalFor.map(r => (
                        <span key={r} className="px-2 py-0.5 bg-status-waiting/15 rounded text-[10px] font-medium text-status-waiting">{r}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <FieldRow label="Internet access">
                      <Switch
                        checked={agent.permissions.networkAccess}
                        onCheckedChange={v => update.mutate({
                          permissions: { ...agent.permissions!, networkAccess: v }
                        })}
                      />
                    </FieldRow>
                    <FieldRow label="Can work in background">
                      <Switch
                        checked={agent.permissions.backgroundAllowed}
                        onCheckedChange={v => update.mutate({
                          permissions: { ...agent.permissions!, backgroundAllowed: v }
                        })}
                      />
                    </FieldRow>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-border text-center space-y-2 mt-2">
                  <Shield className="w-6 h-6 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No guardrails configured yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => update.mutate({
                      permissions: {
                        id: `perm-${Date.now()}`, agentId: agent.id,
                        safetyLevel: 'moderate', toolScopes: [], dataScopes: [],
                        networkAccess: false, requiresApprovalFor: ['all-actions'],
                        backgroundAllowed: false,
                      }
                    })}
                  >
                    Set up guardrails
                  </Button>
                </div>
              )}
            </AdvancedSection>

            {/* Audience — USER.md */}
            <AdvancedSection
              title="Audience"
              icon={<Users className="w-4 h-4 text-muted-foreground" />}
              syncLabel="Syncs with USER.md"
            >
              <div className="mt-2">
                <p className="text-[11px] text-muted-foreground mb-1.5">Who is this agent helping? How should it address them?</p>
                <EditableField
                  label=""
                  value={agent.audienceNotes || ''}
                  onSave={v => update.mutate({ audienceNotes: v })}
                  multiline
                  placeholder="e.g. Small business owners who aren't technical. Use simple language, avoid jargon."
                />
              </div>
            </AdvancedSection>

            {/* Environment — TOOLS.md */}
            <AdvancedSection
              title="Environment"
              icon={<Wrench className="w-4 h-4 text-muted-foreground" />}
              syncLabel="Syncs with TOOLS.md"
            >
              <div className="mt-2">
                <p className="text-[11px] text-muted-foreground mb-1.5">What tools, systems, and conventions does this agent work with?</p>
                <EditableField
                  label=""
                  value={agent.environmentNotes || ''}
                  onSave={v => update.mutate({ environmentNotes: v })}
                  multiline
                  placeholder="e.g. Uses Google Workspace, Notion for docs, Slack for messaging. Prefers markdown output."
                />
              </div>
            </AdvancedSection>

            {/* Memory — MEMORY.md */}
            <AdvancedSection
              title="Memory"
              icon={<Database className="w-4 h-4 text-muted-foreground" />}
              syncLabel="Syncs with MEMORY.md"
            >
              <div className="mt-2">
                <p className="text-[11px] text-muted-foreground mb-1.5">What should this agent remember over time?</p>
                <EditableField
                  label=""
                  value={agent.memoryNotes || ''}
                  onSave={v => update.mutate({ memoryNotes: v })}
                  multiline
                  placeholder="e.g. Remember that we prefer concise summaries. Our fiscal year starts in April."
                />
              </div>
            </AdvancedSection>
          </TabsContent>

          {/* ════════════════════════════════════ */}
          {/* TAB: WORKSPACE */}
          {/* ════════════════════════════════════ */}
          <TabsContent value="workspace" className="m-0 p-3 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Workspace</p>
                <p className="text-[10px] text-muted-foreground">Files on disk</p>
              </div>
            </div>
            {agent.workspacePath ? (
              <div className="space-y-3">
                <div className="bg-muted rounded-lg p-2.5 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Workspace folder</p>
                  <p className="text-xs font-mono text-foreground break-all">{agent.workspacePath}</p>
                </div>
                {['AGENTS.md', 'USER.md', 'TOOLS.md', 'MEMORY.md'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs py-1">
                    <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{f}</span>
                  </div>
                ))}
                {agent.obsidianVaultPath && (
                  <div className="bg-muted rounded-lg p-2.5 space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Obsidian vault</p>
                    <p className="text-xs font-mono text-foreground break-all">{agent.obsidianVaultPath}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-lg">
                <FolderOpen className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground mb-1">No workspace set up</p>
                <p className="text-[10px] text-muted-foreground">Open the full profile to configure.</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Footer ── */}
      <div className="p-2 border-t border-border shrink-0 flex gap-1">
        <Button size="sm" variant="ghost" className="text-[10px] h-7 text-destructive hover:text-destructive flex-1" onClick={handleDelete}>
          <Trash2 className="w-3 h-3" /> Remove from office
        </Button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════
// ── Sub-components ──
// ══════════════════════════════════════

const EditableField = ({ label, value, onSave, multiline, placeholder }: {
  label: string; value: string; onSave: (v: string) => void; multiline?: boolean; placeholder?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  React.useEffect(() => setDraft(value), [value]);

  const save = () => {
    if (draft.trim() !== value) {
      onSave(draft.trim());
      if (label) toast.success(`Updated ${label.toLowerCase()}`);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-1">
        {label && <p className="text-[10px] text-muted-foreground">{label}</p>}
        {multiline ? (
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="text-xs min-h-[48px] resize-none" autoFocus onBlur={save} placeholder={placeholder} />
        ) : (
          <Input value={draft} onChange={e => setDraft(e.target.value)} className="h-7 text-xs" autoFocus onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} placeholder={placeholder} />
        )}
      </div>
    );
  }

  return (
    <div className="group flex items-start justify-between gap-2 py-0.5 cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 transition-colors" onClick={() => setEditing(true)}>
      <div className="min-w-0">
        {label && <p className="text-[10px] text-muted-foreground">{label}</p>}
        <p className="text-xs text-foreground">{value || <span className="text-muted-foreground italic">{placeholder || 'Click to edit'}</span>}</p>
      </div>
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-2 shrink-0" />
    </div>
  );
};

const TaskAssigner = ({ agent }: { agent: Agent }) => {
  const update = useUpdateAgent(agent.id);
  const [input, setInput] = useState('');

  const assign = () => {
    if (!input.trim()) return;
    update.mutate({
      currentTask: input.trim(), state: 'working', zone: 'work',
      lastRunAt: new Date(), lastRunStatus: 'running',
      activities: [
        { id: `act-${Date.now()}`, timestamp: new Date(), action: 'Task Assigned', detail: input.trim() },
        ...agent.activities,
      ],
      runs: [
        { id: `run-${Date.now()}`, agentId: agent.id, trigger: 'manual', status: 'running', startedAt: new Date(), finishedAt: null, inputSummary: input.trim(), outputSummary: null, errorSummary: null, backendRef: null },
        ...agent.runs,
      ],
    });
    setInput('');
    toast.success(`Task assigned to ${agent.name}`);
  };

  return (
    <div>
      <SectionLabel>Give them something to do</SectionLabel>
      <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={`What should ${agent.name} work on?`} className="min-h-[56px] text-xs resize-none" />
      <Button size="sm" className="w-full mt-1.5 text-xs h-7" disabled={!input.trim()} onClick={assign}>
        <Play className="w-3 h-3" /> Assign & run
      </Button>
    </div>
  );
};

export default AgentInspector;
