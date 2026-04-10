import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, ArrowRight, Check, User, Briefcase, Sparkles, Palette,
  Brain, Monitor, Cloud, RefreshCw, Shield, Rocket, Hand, Zap,
  Coffee, BookOpen, Laptop, Users, ChevronRight,
} from 'lucide-react';
import {
  AgentAppearance, Agent, OfficeZone, Archetype, Vibe, RuntimeMode, SmartLevel,
  DEFAULT_APPEARANCE, ARCHETYPE_LABELS, VIBE_LABELS,
} from '@/types/agent';
import { addAgent } from '@/store/agentStore';
import { agentTemplates } from '@/data/mockAgents';
import ModelSetupWizard from '@/components/ModelSetupWizard';
import { toast } from 'sonner';

const STEPS = ['Name', 'Role', 'Character', 'Look', 'Model', 'Where It Runs', 'Permissions', 'Background', 'Review'];

const SKIN_TONES = ['#FDDBB4', '#F1C27D', '#D2A679', '#8D5524', '#6B3A2A', '#3B1F0B'];
const HAIR_COLORS = ['#1A1A1A', '#3B2716', '#A0522D', '#D4A44C', '#C0392B', '#8E44AD', '#F5F5DC'];
const OUTFIT_COLORS = ['#5B8C5A', '#C06030', '#4A6FA5', '#9B59B6', '#2C3E50', '#E67E22', '#E74C3C', '#1ABC9C', '#F39C12', '#34495E'];
const ACCENT_COLORS = ['#E67E22', '#2ECC71', '#3498DB', '#E91E63', '#F39C12', '#1ABC9C', '#9B59B6', '#E74C3C'];
const SHOE_COLORS = ['#333333', '#5D4037', '#1A237E', '#880E4F', '#4A4A4A', '#FFFFFF'];
const BODY_TYPES: AgentAppearance['bodyType'][] = ['masculine', 'feminine', 'androgynous'];
const HAIR_STYLES: AgentAppearance['hairStyle'][] = ['short', 'long', 'curly', 'buzz', 'ponytail', 'bun', 'mohawk', 'braids', 'wavy', 'afro', 'shaved'];
const OUTFIT_STYLES: AgentAppearance['outfitStyle'][] = ['casual', 'formal', 'sporty', 'techy', 'creative', 'cozy'];
const OUTFIT_PATTERNS: AgentAppearance['outfitPattern'][] = ['solid', 'striped', 'dotted', 'plaid'];
const FACIAL_HAIR: AgentAppearance['facialHair'][] = ['none', 'stubble', 'beard', 'mustache', 'goatee'];
const HEADWEAR: AgentAppearance['headwear'][] = ['none', 'cap', 'beanie', 'headband', 'beret'];
const GLASSES: AgentAppearance['glasses'][] = ['none', 'round', 'square', 'aviator'];
const ACCESSORIES: AgentAppearance['accessories'][number][] = ['none', 'headphones', 'scarf', 'watch', 'necklace', 'earbuds'];
const VOICE_PRESETS: AgentAppearance['voicePreset'][] = ['neutral', 'warm', 'direct', 'playful', 'calm'];

const STEP_ICONS = [User, Briefcase, Sparkles, Palette, Brain, Monitor, Shield, RefreshCw, Check];

const CreateAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const template = templateId ? agentTemplates.find(t => t.id === templateId) : null;
  const prefill = template?.prefill;

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [role, setRole] = useState(prefill?.role ?? '');
  const [purpose, setPurpose] = useState(prefill?.purpose ?? '');
  const [personality, setPersonality] = useState(prefill?.personality ?? '');
  const [archetype, setArchetype] = useState<Archetype>(prefill?.archetype ?? 'helper');
  const [vibe, setVibe] = useState<Vibe>(prefill?.vibe ?? 'calm');
  const [zone, setZone] = useState<OfficeZone>(prefill?.zone ?? 'work');
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>(prefill?.runtimeMode ?? 'local');
  const [smartnessLevel, setSmartnessLevel] = useState<SmartLevel>(prefill?.smartnessLevel ?? 'standard');
  const [requiresApproval, setRequiresApproval] = useState(prefill?.requiresApproval ?? true);
  const [backgroundEnabled, setBackgroundEnabled] = useState(prefill?.backgroundEnabled ?? false);
  const [backgroundBehavior, setBackgroundBehavior] = useState(prefill?.backgroundBehavior ?? '');
  const [appearance, setAppearance] = useState<AgentAppearance>({ ...DEFAULT_APPEARANCE, ...prefill?.appearance });

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return role.trim().length > 0;
    return true;
  };

  const handleCreate = () => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      purpose: purpose.trim() || role.trim(),
      archetype,
      vibe,
      personality: personality.trim() || 'Friendly and helpful',
      instructions: '',
      smartnessLevel,
      runtimeMode,
      enabled: true,
      backgroundEnabled,
      state: 'idle',
      zone,
      defaultRoom: zone,
      checkInFrequency: 'after-each-task',
      escalationBehavior: 'pause-and-wait',
      taskStyle: 'step-by-step',
      notifyOnComplete: true,
      notifyOnError: true,
      audienceNotes: '',
      environmentNotes: '',
      memoryNotes: '',
      memoryItems: [],
      ruleItems: [],
      appearance,
      currentTask: null,
      lastRunAt: null,
      lastRunStatus: null,
      permissionProfileId: null,
      scheduleSummary: backgroundBehavior || null,
      activities: [
        { id: `act-${Date.now()}`, timestamp: new Date(), action: 'Created', detail: `${name} joined the office` },
      ],
      runs: [],
      permissions: requiresApproval ? {
        id: `perm-${Date.now()}`, agentId: `agent-${Date.now()}`,
        safetyLevel: 'moderate', toolScopes: [], dataScopes: [],
        networkAccess: false, requiresApprovalFor: ['all-actions'],
        backgroundAllowed: backgroundEnabled,
      } : null,
      schedule: null,
    };
    addAgent(newAgent);
    toast.success(`${name} has joined the office!`);
    navigate(`/agents/${newAgent.id}/welcome`);
  };

  const renderAvatarPreview = () => {
    const AvatarPreview = React.lazy(() => import('@/components/AvatarPreview'));
    return (
      <React.Suspense fallback={<div className="w-28 h-28 mx-auto bg-muted rounded-xl" />}>
        <AvatarPreview appearance={appearance} name={name} size={112} className="mx-auto" />
      </React.Suspense>
    );
  };

  const ColorPicker = ({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (c: string) => void }) => (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <div className="flex gap-2 mt-1 flex-wrap">
        {colors.map(c => (
          <button key={c} onClick={() => onChange(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${value === c ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );

  const ChipPicker = <T extends string>({ label, options, value, onChange, format }: { label: string; options: T[]; value: T; onChange: (v: T) => void; format?: (v: T) => string }) => (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <div className="flex gap-1.5 mt-1 flex-wrap">
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${value === o ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
            {format ? format(o) : o}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep = () => {
    const StepIcon = STEP_ICONS[step];
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            {template && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">
                  Starting from: <span className="font-semibold text-foreground">{template.name}</span> — you can change anything
                </p>
              </div>
            )}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">What's their name?</h2>
              <p className="text-sm text-muted-foreground">Pick a name for your new teammate</p>
            </div>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Scout, Pepper, Atlas..." className="text-center text-lg h-12" autoFocus />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">What will {name || 'they'} do?</h2>
              <p className="text-sm text-muted-foreground">Describe their role and purpose</p>
            </div>
            <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Research Assistant, Code Reviewer..." className="text-center h-12" autoFocus />
            <Textarea value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="What specifically should they help with?" className="min-h-[80px] mt-2" />
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">Character & Personality</h2>
              <p className="text-sm text-muted-foreground">What kind of teammate is {name || 'this agent'}?</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Archetype</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ARCHETYPE_LABELS) as Archetype[]).map(a => (
                  <button key={a} onClick={() => setArchetype(a)} className={`p-2.5 rounded-xl border-2 text-center text-xs font-medium transition-all ${archetype === a ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                    {ARCHETYPE_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Vibe</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(VIBE_LABELS) as Vibe[]).map(v => (
                  <button key={v} onClick={() => setVibe(v)} className={`p-2.5 rounded-xl border-2 text-center text-xs font-medium transition-all ${vibe === v ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                    {VIBE_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <Textarea value={personality} onChange={e => setPersonality(e.target.value)} placeholder="Describe their working style in your own words..." className="min-h-[80px]" />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="font-display font-bold text-xl text-foreground">Design {name || 'your agent'}</h2>
              <p className="text-sm text-muted-foreground">Customize their look</p>
            </div>
            {renderAvatarPreview()}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
              <ChipPicker label="Body Type" options={BODY_TYPES} value={appearance.bodyType} onChange={v => setAppearance(a => ({ ...a, bodyType: v }))} />
              <ColorPicker label="Skin Tone" colors={SKIN_TONES} value={appearance.skinTone} onChange={c => setAppearance(a => ({ ...a, skinTone: c }))} />
              <ChipPicker label="Hair Style" options={HAIR_STYLES} value={appearance.hairStyle} onChange={v => setAppearance(a => ({ ...a, hairStyle: v }))} />
              <ColorPicker label="Hair Color" colors={HAIR_COLORS} value={appearance.hairColor} onChange={c => setAppearance(a => ({ ...a, hairColor: c }))} />
              <ChipPicker label="Outfit Style" options={OUTFIT_STYLES} value={appearance.outfitStyle} onChange={v => setAppearance(a => ({ ...a, outfitStyle: v }))} />
              <ColorPicker label="Outfit Color" colors={OUTFIT_COLORS} value={appearance.outfitColor} onChange={c => setAppearance(a => ({ ...a, outfitColor: c }))} />
              <ChipPicker label="Pattern" options={OUTFIT_PATTERNS} value={appearance.outfitPattern} onChange={v => setAppearance(a => ({ ...a, outfitPattern: v }))} />
              <ColorPicker label="Accent Color" colors={ACCENT_COLORS} value={appearance.accentColor} onChange={c => setAppearance(a => ({ ...a, accentColor: c }))} />
              <ColorPicker label="Shoe Color" colors={SHOE_COLORS} value={appearance.shoeColor} onChange={c => setAppearance(a => ({ ...a, shoeColor: c }))} />
              <ChipPicker label="Glasses" options={GLASSES} value={appearance.glasses} onChange={v => setAppearance(a => ({ ...a, glasses: v }))} />
              <ChipPicker label="Facial Hair" options={FACIAL_HAIR} value={appearance.facialHair} onChange={v => setAppearance(a => ({ ...a, facialHair: v }))} />
              <ChipPicker label="Headwear" options={HEADWEAR} value={appearance.headwear} onChange={v => setAppearance(a => ({ ...a, headwear: v }))} />
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Accessory</Label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {ACCESSORIES.map(acc => (
                    <button key={acc} onClick={() => setAppearance(a => ({ ...a, accessories: [acc] }))} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${appearance.accessories[0] === acc ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
              <ChipPicker label="Voice Preset" options={VOICE_PRESETS} value={appearance.voicePreset} onChange={v => setAppearance(a => ({ ...a, voicePreset: v }))} />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">Model Setup</h2>
              <p className="text-sm text-muted-foreground">Choose how {name || 'your agent'} thinks</p>
            </div>
            <ModelSetupWizard embedded onComplete={() => setStep(s => s + 1)} />
          </div>
        );
      case 5:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Monitor className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">How smart & where does it run?</h2>
              <p className="text-sm text-muted-foreground">Choose the brainpower and where your teammate works</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">How smart should it be?</Label>
              <p className="text-xs text-muted-foreground mb-3">Higher intelligence costs more and runs slower, but handles harder tasks. Pick the lowest level that gets the job done well.</p>
              <div className="space-y-2">
                {([
                  { val: 'basic' as SmartLevel, label: 'Quick & Simple', desc: 'Best for repetitive, straightforward tasks like sorting emails, formatting text, or filling templates. Fast, cheap, and can run on a local model.', example: 'Rename these files, reformat this list, send a daily summary', icon: Zap },
                  { val: 'standard' as SmartLevel, label: 'Balanced', desc: 'Handles most work well — writing, summarizing, answering questions, light analysis. A good default for most agents.', example: 'Draft a blog post, review a document, plan a meeting agenda', icon: Brain },
                  { val: 'advanced' as SmartLevel, label: 'Deep Thinker', desc: 'For tasks that need careful reasoning, nuance, or creativity. Uses the most powerful models. Takes longer and costs more per run.', example: 'Analyze a legal contract, write a strategy memo, debug complex code', icon: Rocket },
                ]).map(opt => (
                  <button key={opt.val} onClick={() => setSmartnessLevel(opt.val)} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${smartnessLevel === opt.val ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                    <div className="flex items-center gap-3 mb-1">
                      <opt.icon className="w-5 h-5 text-primary shrink-0" />
                      <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-8">{opt.desc}</p>
                    <p className="text-[10px] text-muted-foreground/70 ml-8 mt-1 italic">e.g. {opt.example}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Where does it run?</Label>
              <div className="space-y-2">
                {([
                  { val: 'local' as RuntimeMode, label: 'On your computer', desc: 'Uses local models, fully private, works offline', icon: Laptop },
                  { val: 'cloud' as RuntimeMode, label: 'Online (cloud)', desc: 'More powerful models, requires internet', icon: Cloud },
                  { val: 'hybrid' as RuntimeMode, label: 'Both (hybrid)', desc: 'Uses local when possible, cloud for complex tasks', icon: RefreshCw },
                ]).map(opt => (
                  <button key={opt.val} onClick={() => setRuntimeMode(opt.val)} className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${runtimeMode === opt.val ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                    <opt.icon className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Default Zone</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'work' as OfficeZone, label: 'Work Area', icon: Laptop },
                  { id: 'meeting' as OfficeZone, label: 'Meeting Room', icon: Users },
                  { id: 'lounge' as OfficeZone, label: 'Lounge', icon: Coffee },
                  { id: 'quiet' as OfficeZone, label: 'Quiet Corner', icon: BookOpen },
                ]).map(z => (
                  <button key={z.id} onClick={() => setZone(z.id)} className={`p-3 rounded-xl border-2 text-center text-xs font-medium transition-all flex flex-col items-center gap-1.5 ${zone === z.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                    <z.icon className="w-5 h-5 text-muted-foreground" />
                    <span>{z.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">Safety & Approvals</h2>
              <p className="text-sm text-muted-foreground">How much autonomy does {name || 'your agent'} get?</p>
            </div>
            <div className="space-y-3">
              {[
                { val: true, label: 'Needs your approval', desc: 'Checks in before doing anything important. Recommended for new agents.', icon: Shield },
                { val: false, label: 'Fully autonomous', desc: 'Acts independently. You can review everything later in the audit trail.', icon: Rocket },
              ].map(opt => (
                <button key={String(opt.val)} onClick={() => setRequiresApproval(opt.val)} className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${requiresApproval === opt.val ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                  <opt.icon className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg mt-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Tip:</span> You can always change permissions later. Starting with approvals enabled is the safest choice.
              </p>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <RefreshCw className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">Background Behavior</h2>
              <p className="text-sm text-muted-foreground">Should {name || 'your agent'} work when you're away?</p>
            </div>
            <div className="space-y-3">
              {[
                { val: false, label: 'Only when I ask', desc: 'Stays idle until you give a task. Simplest option.', icon: Hand },
                { val: true, label: 'Can work in background', desc: 'Runs scheduled tasks or monitors things on its own.', icon: RefreshCw },
              ].map(opt => (
                <button key={String(opt.val)} onClick={() => setBackgroundEnabled(opt.val)} className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${backgroundEnabled === opt.val ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                  <opt.icon className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {backgroundEnabled && (
              <div className="mt-2">
                <Label className="text-xs font-semibold text-muted-foreground">What should they do in the background?</Label>
                <Textarea value={backgroundBehavior} onChange={e => setBackgroundBehavior(e.target.value)} placeholder="e.g. Check for new PRs every 2 hours, monitor inbox for urgent emails..." className="min-h-[80px] mt-1" />
              </div>
            )}
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">Meet {name}!</h2>
              <p className="text-sm text-muted-foreground">Your new teammate is ready</p>
            </div>
            {renderAvatarPreview()}
            <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold text-foreground">{name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-semibold text-foreground">{role}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Archetype</span><span className="font-semibold text-foreground">{ARCHETYPE_LABELS[archetype]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vibe</span><span className="font-semibold text-foreground">{VIBE_LABELS[vibe]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Smartness</span><span className="font-semibold text-foreground capitalize">{smartnessLevel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Runs on</span><span className="font-semibold text-foreground capitalize">{runtimeMode}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Zone</span><span className="font-semibold text-foreground capitalize">{zone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Approvals</span><span className="font-semibold text-foreground">{requiresApproval ? 'Required' : 'Autonomous'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Background</span><span className="font-semibold text-foreground">{backgroundEnabled ? 'Enabled' : 'Off'}</span></div>
              {personality && <div className="pt-1 border-t border-border"><span className="text-muted-foreground text-xs">Personality: </span><span className="text-xs text-foreground">{personality}</span></div>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mb-6 font-medium">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
        <div className="min-h-[320px]">
          {renderStep()}
        </div>
        <div className="flex gap-3 mt-8">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex-1">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleCreate} className="flex-1">
              <Check className="w-4 h-4" /> Create Teammate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAgentPage;
