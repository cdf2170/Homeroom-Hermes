import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, ArrowRight, Sparkles, Shield, Zap, Brain, Rocket,
  Laptop, Cloud, RefreshCw, Check, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { RuntimeMode, SmartLevel } from '@/types/agent';
import { toast } from 'sonner';
import { useCreateAgent } from '@/hooks/api/useAgents';

// ── Prompt parsing ─────────────────────────────────────────────────────────────

const STARTERS = [
  'Monitor my emails and send a daily digest every morning',
  'Review pull requests and flag anything risky',
  'Research topics and summarise findings in a short report',
  'Track my calendar and remind me of upcoming deadlines',
  'Proofread documents and suggest clearer phrasing',
  'Keep an eye on a folder and organise new files automatically',
];

function suggestSmartness(prompt: string): SmartLevel {
  const p = prompt.toLowerCase();
  if (/\b(code|debug|analys|research|strateg|contract|legal|complex|architect)\b/.test(p)) return 'advanced';
  if (/\b(remind|format|sort|rename|daily|weekly|template|digest)\b/.test(p)) return 'basic';
  return 'standard';
}

function suggestRuntime(prompt: string): RuntimeMode {
  const p = prompt.toLowerCase();
  if (/\b(private|local|offline|sensitive|confidential)\b/.test(p)) return 'local';
  return 'cloud';
}

function suggestName(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/email|inbox|mail/.test(p)) return 'Mailer';
  if (/\bcode\b|pull request|\bpr\b|review|debug/.test(p)) return 'Scout';
  if (/research|topic|summar/.test(p)) return 'Sage';
  if (/calendar|deadline|remind|schedul/.test(p)) return 'Tempo';
  if (/\bfile|\bfolder|organis|sort/.test(p)) return 'Felix';
  if (/proofread|draft|edit|writ/.test(p)) return 'Quill';
  return '';
}

function buildPersonality(name: string, prompt: string): string {
  return `${name} is helpful, clear, and thorough. When a task is ambiguous, asks one focused clarifying question before starting. Shows work rather than hiding reasoning. Never makes irreversible changes without checking first.`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const SmartPill = ({ level, label, desc, icon: Icon, selected, onClick }: {
  level: SmartLevel; label: string; desc: string; icon: React.ElementType; selected: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
  >
    <Icon className={`w-4 h-4 mb-1.5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
    <p className="text-xs font-semibold text-foreground">{label}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
  </button>
);

const RuntimePill = ({ val, label, desc, icon: Icon, selected, onClick }: {
  val: RuntimeMode; label: string; desc: string; icon: React.ElementType; selected: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
  >
    <Icon className={`w-4 h-4 mb-1.5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
    <p className="text-xs font-semibold text-foreground">{label}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
  </button>
);

// ── Main page ──────────────────────────────────────────────────────────────────

const CreateAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const createAgent = useCreateAgent();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Step 0 = prompt, step 1 = review
  const [step, setStep] = useState(0);

  // Prompt step state
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState('');

  // Review step state (seeded from prompt analysis)
  const [purpose, setPurpose] = useState('');
  const [personalityText, setPersonalityText] = useState('');
  const [smartness, setSmartness] = useState<SmartLevel>('standard');
  const [runtime, setRuntime] = useState<RuntimeMode>('cloud');
  const [requiresApproval] = useState(true); // always on — shown as a guarantee, not a toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (step === 0) textareaRef.current?.focus();
  }, [step]);

  const handleNext = () => {
    const trimmedPrompt = prompt.trim();
    const suggestedName = name.trim() || suggestName(trimmedPrompt);

    setPurpose(trimmedPrompt);
    setPersonalityText(buildPersonality(suggestedName || 'This agent', trimmedPrompt));
    setSmartness(suggestSmartness(trimmedPrompt));
    setRuntime(suggestRuntime(trimmedPrompt));
    if (suggestedName && !name.trim()) setName(suggestedName);
    setStep(1);
  };

  const handleCreate = async () => {
    const agentName = name.trim();
    if (!agentName) return;

    try {
      const created = await createAgent.mutateAsync({
        name: agentName,
        purpose: purpose.trim(),
        smartnessLevel: smartness,
        runtimeMode: runtime,
      });

      const { backendApi } = await import('@/services/backendApi');
      await backendApi.updateAgent(created.id, {
        instructions:     personalityText.trim(),
        backgroundEnabled: false,
        notifyOnComplete:  true,
        notifyOnError:     true,
      });

      toast.success(`${agentName} has joined the office!`);
      navigate(`/agents/${created.id}`);
    } catch {
      // toast handled by mutation's onError
    }
  };

  // ── Step 0: Prompt ───────────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">

          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground mb-1">What should this agent do?</h1>
            <p className="text-sm text-muted-foreground">Describe the job in plain language. The more specific, the better.</p>
          </div>

          <div className="space-y-4">
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && prompt.trim().length > 10) handleNext(); }}
              placeholder="e.g. Monitor my GitHub notifications and send me a morning summary of anything that needs my attention. Flag open review requests and unanswered mentions."
              className="min-h-[120px] text-sm leading-relaxed resize-none"
            />

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Or start from an example</p>
              <div className="flex flex-wrap gap-1.5">
                {STARTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Name <span className="font-normal normal-case">(optional — we'll suggest one)</span></label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Scout, Pepper, Atlas..."
                className="h-10"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button
              onClick={handleNext}
              disabled={prompt.trim().length < 10}
              className="w-full"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-4">
            You can refine everything on the next screen. Nothing is permanent.
          </p>
        </div>
      </div>
    );
  }

  // ── Step 1: Review & launch ──────────────────────────────────────────────────

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">

        <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Edit description
        </button>

        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-foreground mb-1">Review your agent</h1>
          <p className="text-sm text-muted-foreground">We filled this in from your description. Change anything before launching.</p>
        </div>

        <div className="space-y-4">

          {/* Name */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Give them a name"
              className="h-10 font-semibold"
              autoFocus
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">What they do</label>
            <Textarea
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="min-h-[72px] text-sm resize-none"
            />
          </div>

          {/* Smartness */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Intelligence level</label>
            <div className="flex gap-2">
              <SmartPill level="basic" label="Quick" desc="Simple, fast tasks" icon={Zap} selected={smartness === 'basic'} onClick={() => setSmartness('basic')} />
              <SmartPill level="standard" label="Balanced" desc="Most everyday work" icon={Brain} selected={smartness === 'standard'} onClick={() => setSmartness('standard')} />
              <SmartPill level="advanced" label="Deep" desc="Complex reasoning" icon={Rocket} selected={smartness === 'advanced'} onClick={() => setSmartness('advanced')} />
            </div>
          </div>

          {/* Runtime */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Runs on</label>
            <div className="flex gap-2">
              <RuntimePill val="local" label="Your computer" desc="Private, offline" icon={Laptop} selected={runtime === 'local'} onClick={() => setRuntime('local')} />
              <RuntimePill val="cloud" label="Cloud" desc="More powerful models" icon={Cloud} selected={runtime === 'cloud'} onClick={() => setRuntime('cloud')} />
              <RuntimePill val="hybrid" label="Hybrid" desc="Best of both" icon={RefreshCw} selected={runtime === 'hybrid'} onClick={() => setRuntime('hybrid')} />
            </div>
          </div>

          {/* Safety guarantee */}
          <div className="flex items-start gap-3 p-4 bg-status-working/5 border border-status-working/20 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-status-working/15 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-3.5 h-3.5 text-status-working" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Approval required before acting</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {name || 'This agent'} will check in with you before doing anything significant. No background tasks, no autonomous actions. You can open that up later once you trust how it behaves.
              </p>
            </div>
          </div>

          {/* Advanced (personality) */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showAdvanced ? 'Hide' : 'Edit personality and tone'}
          </button>

          {showAdvanced && (
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Personality</label>
              <Textarea
                value={personalityText}
                onChange={e => setPersonalityText(e.target.value)}
                className="min-h-[96px] text-sm resize-none"
                placeholder="Describe how this agent should communicate and behave..."
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={() => setStep(0)} className="flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !purpose.trim() || createAgent.isPending}
            className="flex-1"
          >
            {createAgent.isPending ? (
              <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</span>
            ) : (
              <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Add to office</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateAgentPage;
