import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Home, Search, Monitor, Cloud, RefreshCw, Sparkles, Info } from 'lucide-react';

const ONBOARDING_KEY = 'homeroom-onboarded';

export function hasCompletedOnboarding() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function completeOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

const steps = [
  {
    icon: Home,
    title: 'Welcome to Homeroom',
    body: 'Your AI agents live here as digital coworkers in a cozy office. No coding required — just point, click, and manage your team.',
  },
  {
    icon: Search,
    title: 'Detecting your setup',
    body: 'Homeroom powers your agents behind the scenes. Right now we\'re running in demo mode — you can explore everything without connecting anything.',
    detail: 'When you\'re ready, connect your AI models and your agents will start doing real work.',
  },
  {
    icon: Monitor,
    title: 'Local vs. Cloud',
    body: 'Your agents can run in two ways:',
    bullets: [
      { icon: Monitor, label: 'Local', desc: 'Runs on your computer. Fully private, works offline, uses local AI models.' },
      { icon: Cloud, label: 'Cloud', desc: 'Uses powerful online models. Faster and smarter, but needs internet.' },
    ],
    detail: 'You choose per agent. You can always change later.',
  },
  {
    icon: RefreshCw,
    title: 'Always-on mode (optional)',
    body: 'By default, Homeroom only runs when you have it open. If you want agents to work in the background (checking emails, monitoring data), you can enable always-on mode later in Settings.',
    detail: 'This is completely optional. Most people start without it.',
  },
  {
    icon: Sparkles,
    title: 'You\'re all set!',
    body: 'Head to the office and create your first agent. You\'ll pick a name, customize their look, and assign their first task.',
    detail: 'The whole thing takes about 2 minutes.',
  },
];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const current = steps[step];
  const IconComponent = current.icon;

  const handleFinish = () => {
    completeOnboarding();
    navigate('/create-agent');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-10">
          {steps.map((_, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors duration-300 ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="text-center min-h-[340px] flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <IconComponent className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-3">{current.title}</h1>
          <p className="text-muted-foreground leading-relaxed max-w-md">{current.body}</p>

          {current.bullets && (
            <div className="mt-5 space-y-3 w-full max-w-sm">
              {current.bullets.map(b => {
                const BulletIcon = b.icon;
                return (
                  <div key={b.label} className="flex items-start gap-3 p-3 bg-muted rounded-xl text-left">
                    <BulletIcon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-foreground">{b.label}</p>
                      <p className="text-xs text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {current.detail && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mt-4 bg-muted/50 px-4 py-2 rounded-lg max-w-sm">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{current.detail}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
              Back
            </Button>
          )}
          {step === 0 && (
            <Button variant="ghost" onClick={() => { completeOnboarding(); navigate('/'); }} className="text-muted-foreground">
              Skip
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} className="flex-1">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="flex-1">
              <Sparkles className="w-4 h-4" /> Create my first agent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
