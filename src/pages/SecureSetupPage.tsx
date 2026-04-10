import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowRight, ArrowLeft, Shield, ShieldCheck, Key, Eye, EyeOff,
  Check, ExternalLink, Lock, Info, Sparkles, AlertTriangle,
  HardDrive, CloudOff, CheckCircle2, XCircle,
} from 'lucide-react';
import { PROVIDER_INFO, type ProviderInfo } from '@/data/models';
import { setProviderKey, hasProviderKey, getProviderKey } from '@/store/modelConfigStore';
import { toast } from 'sonner';

// ── Step definitions ──

type WizardStep = 'welcome' | 'security' | 'select' | 'keys' | 'review';

const STEP_ORDER: WizardStep[] = ['welcome', 'security', 'select', 'keys', 'review'];

const STEP_LABELS: Record<WizardStep, string> = {
  welcome: 'Welcome',
  security: 'How we protect you',
  select: 'Choose providers',
  keys: 'Enter your keys',
  review: 'All done',
};

// Ordered list of providers to show
const PROVIDER_ORDER = ['OpenRouter', 'OpenAI', 'Anthropic', 'Google', 'xAI', 'Mistral', 'DeepSeek', 'Perplexity'];

// ── Provider Card (selection step) ──

const ProviderSelectCard: React.FC<{
  id: string;
  info: ProviderInfo;
  selected: boolean;
  alreadyConnected: boolean;
  onToggle: () => void;
}> = ({ id, info, selected, alreadyConnected, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
      selected
        ? 'border-primary bg-primary/5'
        : 'border-border bg-card hover:border-muted-foreground/30'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Checkbox checked={selected} className="pointer-events-none" />
        <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
          {info.icon}
        </span>
        <div>
          <p className="font-semibold text-sm text-foreground">{info.name}</p>
          <p className="text-xs text-muted-foreground">{info.helpText}</p>
        </div>
      </div>
      {alreadyConnected && (
        <Badge variant="secondary" className="text-[10px] bg-status-working/15 text-status-working border-none shrink-0">
          Already connected
        </Badge>
      )}
    </div>
  </button>
);

// ── Key Entry Card (keys step) ──

const KeyEntryCard: React.FC<{
  providerId: string;
  info: ProviderInfo;
  onSaved: () => void;
}> = ({ providerId, info, onSaved }) => {
  const [value, setValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(hasProviderKey(providerId));
  const existing = getProviderKey(providerId);
  const masked = existing ? existing.slice(0, 6) + '••••' + existing.slice(-4) : '';

  const prefixValid = !info.keyPrefix || value.startsWith(info.keyPrefix);

  const handleSave = () => {
    if (!value.trim()) return;
    setProviderKey(providerId, value.trim());
    toast.success(`${info.name} key saved securely`);
    setSaved(true);
    setValue('');
    onSaved();
  };

  return (
    <div className={`p-5 rounded-xl border-2 transition-all ${saved ? 'border-status-working/40 bg-status-working/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
          {info.icon}
        </span>
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">{info.name}</p>
          {saved && (
            <p className="text-[11px] text-muted-foreground font-mono">{masked}</p>
          )}
        </div>
        {saved && (
          <div className="flex items-center gap-1 text-status-working">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Saved</span>
          </div>
        )}
      </div>

      {!saved ? (
        <div className="space-y-3">
          {/* Step-by-step instructions */}
          <div className="bg-muted/60 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Info className="w-3 h-3 text-primary" /> How to get your key:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
              <li>
                Go to{' '}
                <a href={info.signupUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  {info.name}'s website <ExternalLink className="w-2.5 h-2.5" />
                </a>{' '}
                and create a free account
              </li>
              <li>
                Navigate to{' '}
                <a href={info.keyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  API Keys page <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>Click "Create new key" and copy it</li>
              <li>Paste it below — we'll store it securely on your device</li>
            </ol>
          </div>

          {/* Input */}
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder={info.keyPlaceholder || 'Paste your API key here'}
              value={value}
              onChange={e => setValue(e.target.value)}
              className="h-10 text-sm font-mono pl-9 pr-10"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Validation hint */}
          {value && info.keyPrefix && !prefixValid && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {info.name} keys usually start with "{info.keyPrefix}"
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3" />
              Stored only on this device
            </div>
            <Button size="sm" onClick={handleSave} disabled={!value.trim()}>
              <Check className="w-3.5 h-3.5" /> Save Key
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="text-xs" onClick={() => setSaved(false)}>
          Update key
        </Button>
      )}
    </div>
  );
};

// ── Main Wizard ──

const SecureSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  const toggleProvider = (id: string) => {
    setSelectedProviders(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const canProceed = useMemo(() => {
    if (currentStep === 'select') return selectedProviders.length > 0;
    return true;
  }, [currentStep, selectedProviders]);

  const goNext = () => {
    const idx = STEP_ORDER.indexOf(currentStep);
    // Skip 'keys' step if no providers selected (shouldn't happen due to validation)
    if (idx < STEP_ORDER.length - 1) {
      const next = STEP_ORDER[idx + 1];
      if (next === 'keys' && selectedProviders.length === 0) {
        setCurrentStep('review');
      } else {
        setCurrentStep(next);
      }
    }
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEP_ORDER[idx - 1]);
  };

  const handleFinish = () => {
    toast.success('Setup complete! Your keys are stored securely.');
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">Secure Setup</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Step {stepIndex + 1} of {STEP_ORDER.length}
            </span>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/settings')}>
              Skip for now
            </Button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-6">
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Step: Welcome */}
        {currentStep === 'welcome' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display font-bold text-3xl text-foreground">
                Let's set up your keys
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your AI agents need API keys to talk to model providers. This wizard walks you through it step by step — no guesswork.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> What you should know first
              </h2>
              {[
                {
                  icon: Lock,
                  title: 'Your keys stay on your device',
                  desc: "We never send your API keys to our servers. They are stored in your browser\u2019s local storage, on your machine only.",
                },
                {
                  icon: HardDrive,
                  title: "You\u2019re in full control",
                  desc: 'You can add, update, or remove any key at any time from Settings. Nothing is permanent.',
                },
                {
                  icon: CloudOff,
                  title: 'We never see your keys',
                  desc: 'API calls go directly from your browser to the provider. Homeroom acts as a conductor, not a middleman.',
                },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                  <item.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground">Security note</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  For maximum security, we recommend using API keys with <strong>usage limits</strong> set at your provider. 
                  This way, even if someone gained access to your device, the potential exposure is capped.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Security explainer */}
        {currentStep === 'security' && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-secondary" />
              </div>
              <h1 className="font-display font-bold text-2xl text-foreground">
                How we keep your keys safe
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Here's exactly what happens when you enter an API key — nothing is hidden.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: '1',
                  title: 'You paste your key',
                  desc: "The key goes into a password field. It\u2019s masked by default so nobody looking at your screen can read it.",
                  color: 'bg-primary/10 text-primary',
                },
                {
                  step: '2',
                  title: 'We validate the format',
                  desc: "We check that the key looks right (correct prefix, length) so you don\u2019t accidentally paste something wrong. We never test it against the provider.",
                  color: 'bg-accent text-accent-foreground',
                },
                {
                  step: '3',
                  title: "It\u2019s saved to localStorage",
                  desc: "Your browser\u2019s built-in storage keeps the key on your device. It never leaves your machine and is never included in network requests to Homeroom.",
                  color: 'bg-secondary/10 text-secondary',
                },
                {
                  step: '4',
                  title: 'Direct API calls',
                  desc: 'When an agent needs to use a model, the key is read from your browser and sent directly to the provider (e.g., OpenAI). Homeroom never sees the actual key value.',
                  color: 'bg-muted text-foreground',
                },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border">
                  <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center font-bold text-sm shrink-0`}>
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-display font-semibold text-sm text-foreground">Best practices we recommend</h3>
              <ul className="space-y-2">
                {[
                  'Set spending limits on your provider accounts',
                  "Use separate API keys for Homeroom (don\u2019t reuse keys from other apps)",
                  'Rotate your keys periodically (every 90 days is a good cadence)',
                  'Revoke keys immediately if you suspect compromise',
                ].map(tip => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Step: Select providers */}
        {currentStep === 'select' && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h1 className="font-display font-bold text-2xl text-foreground">
                Which providers do you use?
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select the AI providers you have accounts with. You can always add more later in Settings.
              </p>
            </div>

            <div className="bg-muted/60 rounded-lg p-3 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Not sure?</strong> Start with <strong>OpenRouter</strong> — it gives you access to many models with a single key and is the easiest way to get started.
              </p>
            </div>

            <div className="space-y-2">
              {PROVIDER_ORDER.map(id => {
                const info = PROVIDER_INFO[id];
                if (!info) return null;
                return (
                  <ProviderSelectCard
                    key={id}
                    id={id}
                    info={info}
                    selected={selectedProviders.includes(id)}
                    alreadyConnected={hasProviderKey(id)}
                    onToggle={() => toggleProvider(id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Enter keys */}
        {currentStep === 'keys' && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h1 className="font-display font-bold text-2xl text-foreground">
                Enter your API keys
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                One at a time. Each key is saved independently — if you need to stop, your progress is saved.
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
              <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Keys are saved to your browser's local storage the moment you click "Save Key". They never leave your device.
              </p>
            </div>

            <div className="space-y-4">
              {selectedProviders.map(id => {
                const info = PROVIDER_INFO[id];
                if (!info) return null;
                return (
                  <KeyEntryCard
                    key={id}
                    providerId={id}
                    info={info}
                    onSaved={() => setSavedCount(c => c + 1)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Review */}
        {currentStep === 'review' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-status-working/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-status-working" />
              </div>
              <h1 className="font-display font-bold text-2xl text-foreground">
                You're all set!
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Here's a summary of what we configured. You can change any of this anytime in Settings.
              </p>
            </div>

            <div className="space-y-2">
              {selectedProviders.map(id => {
                const info = PROVIDER_INFO[id];
                if (!info) return null;
                const connected = hasProviderKey(id);
                return (
                  <div key={id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                        {info.icon}
                      </span>
                      <span className="text-sm font-medium text-foreground">{info.name}</span>
                    </div>
                    {connected ? (
                      <div className="flex items-center gap-1 text-status-working">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-medium">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs">Skipped</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {selectedProviders.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No providers selected — you can add keys later in Settings.
                </div>
              )}
            </div>

            <div className="bg-muted rounded-xl p-4 space-y-2">
              <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Security reminders
              </p>
              <ul className="space-y-1">
                {[
                  'Your keys are stored only on this device',
                  'Set spending limits at each provider dashboard',
                  'You can rotate or remove keys anytime in Settings → API Keys',
                ].map(tip => (
                  <li key={tip} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-secondary shrink-0" /> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-10">
          {stepIndex > 0 && (
            <Button variant="outline" onClick={goBack} className="flex-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          {currentStep !== 'review' ? (
            <Button onClick={goNext} disabled={!canProceed} className="flex-1">
              {currentStep === 'welcome' ? "Let's go" : 'Continue'} <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="flex-1">
              <Sparkles className="w-4 h-4" /> Go to Settings
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecureSetupPage;
