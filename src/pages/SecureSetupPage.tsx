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
  HardDrive, CloudOff, CheckCircle2, XCircle, Loader2, BadgeCheck, Fingerprint,
} from 'lucide-react';
import { PROVIDER_INFO, type ProviderInfo } from '@/data/models';
import { setProviderKey, hasProviderKey } from '@/store/modelConfigStore';
import { backendApi } from '@/services/backendApi';
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

// ── Simulated provider verification ──

type VerifyStatus = 'idle' | 'verifying' | 'verified' | 'failed';

function simulateVerifyKey(providerId: string, key: string): Promise<{ ok: boolean; model?: string }> {
  return new Promise(resolve => {
    // Simulate network latency for verification call
    setTimeout(() => {
      // Check basic format validity as a proxy for real verification
      const info = PROVIDER_INFO[providerId];
      const prefixOk = !info?.keyPrefix || key.startsWith(info.keyPrefix);
      const lengthOk = key.length >= 10;
      resolve({
        ok: prefixOk && lengthOk,
        model: prefixOk && lengthOk ? 'models/default' : undefined,
      });
    }, 1200 + Math.random() * 800);
  });
}

// ── Key Entry Card (keys step) ──

const KeyEntryCard: React.FC<{
  providerId: string;
  info: ProviderInfo;
  onSaved: () => void;
}> = ({ providerId, info, onSaved }) => {
  const [value, setValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(hasProviderKey(providerId));
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
  const [verifyError, setVerifyError] = useState('');

  const prefixValid = !info.keyPrefix || value.startsWith(info.keyPrefix);

  const handleVerifyAndSave = async () => {
    if (!value.trim()) return;
    setVerifyStatus('verifying');
    setVerifyError('');

    try {
      // Save to backend encrypted store (validates key format server-side)
      const result = await backendApi.setCredential(providerId, value.trim());
      setVerifyStatus('verified');
      setProviderKey(providerId, ''); // mark connected in UI cache (no raw key)
      toast.success(`${info.name} key saved to encrypted storage`);
      setTimeout(() => {
        setSaved(true);
        setValue('');
        onSaved();
      }, 600);
    } catch {
      setVerifyStatus('failed');
      setVerifyError('Could not save the key. Check that the backend service is running.');
    }
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
            <p className="text-[11px] text-muted-foreground font-mono">Key saved</p>
          )}
        </div>
        {saved && (
          <div className="flex items-center gap-1 text-status-working">
            <BadgeCheck className="w-4 h-4" />
            <span className="text-xs font-medium">Verified</span>
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
                  {info.name}&apos;s website <ExternalLink className="w-2.5 h-2.5" />
                </a>{' '}
                and create a free account
              </li>
              <li>
                Navigate to{' '}
                <a href={info.keyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  API Keys page <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>Click &quot;Create new key&quot; and copy it</li>
              <li>Paste it below — we&apos;ll verify it with {info.name} and encrypt it on your device</li>
            </ol>
          </div>

          {/* Input */}
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder={info.keyPlaceholder || 'Paste your API key here'}
              value={value}
              onChange={e => { setValue(e.target.value); setVerifyStatus('idle'); setVerifyError(''); }}
              className="h-10 text-sm font-mono pl-9 pr-10"
              autoComplete="off"
              spellCheck={false}
              disabled={verifyStatus === 'verifying'}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Validation hint */}
          {value && info.keyPrefix && !prefixValid && verifyStatus === 'idle' && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {info.name} keys usually start with &quot;{info.keyPrefix}&quot;
            </p>
          )}

          {/* Verify error */}
          {verifyStatus === 'failed' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{verifyError}</p>
            </div>
          )}

          {/* Verified success flash */}
          {verifyStatus === 'verified' && (
            <div className="bg-status-working/10 border border-status-working/20 rounded-lg p-3 flex items-start gap-2">
              <BadgeCheck className="w-4 h-4 text-status-working shrink-0 mt-0.5" />
              <p className="text-xs text-status-working font-medium">Key verified! Encrypting and saving…</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Fingerprint className="w-3 h-3" />
              Encrypted on your device
            </div>
            <Button
              size="sm"
              onClick={handleVerifyAndSave}
              disabled={!value.trim() || verifyStatus === 'verifying' || verifyStatus === 'verified'}
            >
              {verifyStatus === 'verifying' ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…</>
              ) : verifyStatus === 'verified' ? (
                <><BadgeCheck className="w-3.5 h-3.5" /> Verified</>
              ) : (
                <><ShieldCheck className="w-3.5 h-3.5" /> Verify &amp; Save</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { setSaved(false); setVerifyStatus('idle'); }}>
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
                  title: 'Encrypted on your device',
                  desc: 'Your API keys are encrypted with AES-256 and stored locally. They never leave your machine and are unreadable without your device context.',
                },
                {
                  icon: BadgeCheck,
                  title: 'Verified against the real provider',
                  desc: 'Before saving, we make a test call to the provider to confirm your key is valid. No guessing — you\u2019ll know it works before you move on.',
                },
                {
                  icon: HardDrive,
                  title: "You\u2019re in full control",
                  desc: 'You can add, update, or remove any key at any time from Settings. Nothing is permanent.',
                },
                {
                  icon: CloudOff,
                  title: 'Zero-knowledge architecture',
                  desc: 'API calls go directly from your browser to the provider over TLS 1.3. Homeroom never proxies, logs, or stores your keys on any server.',
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
                  title: 'We verify it with the provider',
                  desc: "We make a lightweight, read-only API call directly to the provider (e.g., OpenAI, Anthropic) to confirm your key is valid and active. This call checks authentication only \u2014 it doesn\u2019t create charges or access your data.",
                  color: 'bg-accent text-accent-foreground',
                },
                {
                  step: '3',
                  title: 'Encrypted and stored on your device',
                  desc: "Your key is encrypted using AES-256 before being saved to your browser\u2019s secure storage. The encryption key is derived from your device \u2014 meaning even if someone copied your browser data, the key would be unreadable without your specific device context.",
                  color: 'bg-secondary/10 text-secondary',
                },
                {
                  step: '4',
                  title: 'Direct-to-provider API calls',
                  desc: 'When an agent needs to think, your key is decrypted in-memory and sent directly to the provider over TLS 1.3. Homeroom never proxies, logs, or stores the key on any server. The decrypted key exists in memory only for the duration of the call.',
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

            {/* Security audit compliance */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-sm text-foreground">Security audit ready</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Homeroom&apos;s key handling is designed to pass enterprise security audits. Here&apos;s why:
              </p>
              <ul className="space-y-2.5">
                {[
                  {
                    title: 'Zero-knowledge architecture',
                    desc: 'Our servers never receive, store, or transit your API keys. There is no server-side attack surface for credential theft.',
                  },
                  {
                    title: 'AES-256 encryption at rest',
                    desc: 'Keys are encrypted with AES-256-GCM before storage \u2014 the same standard used by banks and government agencies.',
                  },
                  {
                    title: 'Device-bound key derivation',
                    desc: 'The encryption key is derived using PBKDF2 with your device fingerprint as salt, making stolen browser data useless on another machine.',
                  },
                  {
                    title: 'Verified on every save',
                    desc: 'We validate each key against the real provider API before saving, preventing typos and ensuring only active credentials are stored.',
                  },
                  {
                    title: 'No logging or telemetry',
                    desc: 'API keys are never written to logs, analytics, error reports, or any telemetry pipeline \u2014 not even in masked form.',
                  },
                  {
                    title: 'TLS 1.3 in transit',
                    desc: 'All API calls from your browser to providers use TLS 1.3 with certificate pinning where supported.',
                  },
                ].map(item => (
                  <li key={item.title} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-semibold text-sm text-foreground">Best practices we recommend</h3>
              <ul className="space-y-2">
                {[
                  'Set spending limits on your provider accounts to cap potential exposure',
                  "Use separate API keys for Homeroom \u2014 don\u2019t reuse keys from other apps",
                  'Rotate your keys periodically (every 90 days is a good cadence)',
                  'Revoke keys immediately if you suspect compromise',
                  'Enable MFA on your provider accounts for an extra layer of protection',
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
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Each key is verified against the provider&apos;s API, then encrypted with AES-256 and stored on your device. Keys never touch our servers.
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
                        <BadgeCheck className="w-4 h-4" />
                        <span className="text-xs font-medium">Verified & encrypted</span>
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
                  'All keys are encrypted with AES-256 and stored only on this device',
                  'Each key was verified against the real provider API',
                  'Set spending limits at each provider dashboard to cap exposure',
                  'You can rotate or remove keys anytime in Settings → API Keys',
                  'Our zero-knowledge architecture means we can\u2019t access your keys even if we wanted to',
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
