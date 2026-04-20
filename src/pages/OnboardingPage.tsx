import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ArrowLeft, ShieldCheck, Cpu,
  Globe, Zap, HardDrive, Building2, Info,
  CheckCircle2, AlertCircle, ExternalLink,
} from 'lucide-react';

// ── Persistence ───────────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'homeroom-onboarded';

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function completeOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

// ── Shared components ─────────────────────────────────────────────────────────

const CompareCard: React.FC<{
  icon: React.ElementType;
  label: string;
  sublabel: string;
  colour: string;
  pros: string[];
  cons: string[];
}> = ({ icon: Icon, label, sublabel, colour, pros, cons }) => (
  <div className="p-4 bg-card border border-border rounded-xl">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colour}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <p className="text-xs font-semibold text-emerald-600 mb-2">Works well for</p>
        <ul className="space-y-1">
          {pros.map(p => (
            <li key={p} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-semibold text-amber-600 mb-2">Trade-offs</p>
        <ul className="space-y-1">
          {cons.map(c => (
            <li key={c} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'welcome',       label: 'Welcome' },
  { id: 'local-private', label: 'Local & private' },
  { id: 'get-started',   label: 'Get started' },
];

// ── Step 1: Welcome to Homeroom ──────────────────────────────────────────────

function WelcomeStep() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Building2 className="w-7 h-7 text-primary" />
      </div>

      <h1 className="font-display font-bold text-3xl text-foreground mb-4">
        Welcome to Homeroom
      </h1>

      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        Homeroom is a local control plane for AI agents. Instead of juggling chat windows
        and config files, you get a visual dashboard where you create agents, assign them work,
        set rules on what they can access, and watch what they do.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Each agent runs as a real process on your machine using hermes-agent.
        You choose the AI model, connect your API keys, and Homeroom handles the rest.
      </p>
      <div className="flex items-center gap-2 mb-6 p-3 bg-muted rounded-xl">
        <code className="flex-1 text-[11px] font-mono text-foreground select-all break-all">
          https://github.com/NousResearch/hermes-agent
        </code>
        <a
          href="https://github.com/NousResearch/hermes-agent"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 inline-flex items-center gap-1"
        >
          Open <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="space-y-2 mb-6">
        {[
          { icon: Zap,         text: 'Create agents and give them jobs' },
          { icon: ShieldCheck,  text: 'Set rules and limits on what they can access' },
          { icon: Cpu,          text: 'Choose local or cloud AI models per agent' },
          { icon: Building2,    text: 'See everything in a visual office dashboard' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm text-foreground">{text}</p>
          </div>
        ))}
      </div>

      <div className="p-3 bg-muted/50 rounded-xl">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Already familiar with AI agents?</span>{' '}
          Hit "Skip to setup" below and we'll take you straight to the install.
        </p>
      </div>
    </div>
  );
}

// ── Step 2: Local & Private ──────────────────────────────────────────────────

function LocalPrivateStep() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <ShieldCheck className="w-7 h-7 text-primary" />
      </div>

      <h2 className="font-display font-bold text-2xl text-foreground mb-2">
        Local and private by default
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Everything runs on your machine. No cloud account, no sign-up, no data leaving
        your computer unless you explicitly connect a cloud AI provider.
      </p>

      <div className="p-4 bg-card border border-border rounded-xl mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="font-semibold text-sm text-foreground">Security model</p>
        </div>
        <ul className="space-y-1.5">
          {[
            'The backend runs on localhost only — no network exposure',
            'API keys are encrypted (AES-256-GCM) and stored locally',
            'Agents start with no tools and no permissions — you grant them deliberately',
            'Every action is logged with timestamps and reasons',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        You choose where AI runs
      </p>

      <div className="space-y-4 mb-6">
        <CompareCard
          icon={HardDrive}
          label="Local models"
          sublabel="Runs on your computer"
          colour="bg-emerald-500/10 text-emerald-600"
          pros={['Complete privacy', 'Works offline', 'No usage costs']}
          cons={['Depends on your hardware', 'May be slower']}
        />
        <CompareCard
          icon={Globe}
          label="Cloud models"
          sublabel="Runs on a provider's servers"
          colour="bg-blue-500/10 text-blue-600"
          pros={['Stronger reasoning', 'No hardware requirements', 'Faster']}
          cons={['Data sent to provider', 'Needs API key', 'May have costs']}
        />
      </div>

      <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Homeroom makes it clear which mode each agent uses. You always know
            whether your data stays local or goes to a provider.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Get Started ──────────────────────────────────────────────────────

function GetStartedStep() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Zap className="w-7 h-7 text-primary" />
      </div>

      <h2 className="font-display font-bold text-2xl text-foreground mb-2">
        How agents work
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        An AI model is the brain — it thinks and generates responses. Tools are the limbs — they
        let the agent search the web, read files, or check a calendar. You set the rules for what
        each agent can and can't do. Homeroom orchestrates all of it.
      </p>

      <div className="space-y-2 mb-8">
        {[
          { icon: Zap,          label: 'Model',         desc: 'The brain. Thinks, reasons, and generates responses.' },
          { icon: Cpu,           label: 'Tools',          desc: 'The limbs. Search, read, write, and interact with the world.' },
          { icon: ShieldCheck,   label: 'Rules',          desc: 'Your boundaries. What it can access and when it needs approval.' },
          { icon: Building2,     label: 'Homeroom',       desc: 'The control plane. Creates, runs, and monitors everything.' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-center gap-4 p-3 bg-card border border-border rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 bg-card border border-border rounded-xl text-center">
        <p className="font-semibold text-sm text-foreground mb-2">Ready to set up</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Next we'll check that the backend service is running, verify hermes-agent is installed,
          and connect your first AI provider. Takes about a minute.
        </p>
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <div className="flex items-center gap-1 mb-10">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`flex-1 h-1 rounded-full transition-all duration-300 ${
          i < step ? 'bg-primary' : i === step ? 'bg-primary/50' : 'bg-muted'
        }`}
      />
    ))}
  </div>
);

const StepPill: React.FC<{ step: number; label: string; total: number }> = ({ step, label, total }) => (
  <div className="flex items-center justify-between mb-6">
    <span className="text-xs text-muted-foreground font-medium">{label}</span>
    <span className="text-xs text-muted-foreground">{step + 1} / {total}</span>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const STEP_SCREENS = [WelcomeStep, LocalPrivateStep, GetStartedStep];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const isLast = step === total - 1;
  const StepScreen = STEP_SCREENS[step];

  const goToStep = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate('/setup');
  };

  const handleFinish = () => {
    completeOnboarding();
    navigate('/setup');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              H
            </div>
            <span className="font-display font-bold text-foreground text-sm">Homeroom</span>
            <span className="text-muted-foreground text-xs">· Setup</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <ProgressBar step={step} total={total} />
        <StepPill step={step} label={STEPS[step].label} total={total} />

        <div className="pb-8">
          <StepScreen />
        </div>

        <div className="flex items-center gap-3 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={() => goToStep(step - 1)} className="flex-none">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}

          <Button variant="outline" className="flex-none" onClick={handleSkip}>
            Skip to setup
          </Button>

          <div className="flex-1" />

          {isLast ? (
            <Button onClick={handleFinish} size="lg" className="gap-2">
              Get started <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => goToStep(step + 1)} size="lg" className="gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
