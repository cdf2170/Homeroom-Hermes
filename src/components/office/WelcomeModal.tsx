import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Home, MousePointer, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WELCOME_KEY = 'homeroom-welcomed';

export function hasSeenWelcome() {
  return localStorage.getItem(WELCOME_KEY) === 'true';
}

function markWelcomeSeen() {
  localStorage.setItem(WELCOME_KEY, 'true');
}

const slides = [
  {
    icon: Home,
    title: 'Welcome to Homeroom',
    body: 'Your AI agents live here as digital coworkers in a cozy office. No coding required — just point, click, and manage your team.',
  },
  {
    icon: MousePointer,
    title: 'Click agents to inspect them',
    body: 'Each agent sits at their desk. Click one to see what they\'re working on, check their status, adjust permissions, or give them a new task.',
  },
  {
    icon: Plus,
    title: 'Create your first agent',
    body: 'Head to the sidebar and click "New Agent" to design a coworker — pick their name, look, role, and personality. It takes about 2 minutes.',
  },
];

const WelcomeModal: React.FC = () => {
  const [open, setOpen] = useState(!hasSeenWelcome());
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = slides[step];
  const IconComponent = current.icon;

  const handleDismiss = () => {
    markWelcomeSeen();
    setOpen(false);
  };

  const handleCreateAgent = () => {
    markWelcomeSeen();
    setOpen(false);
    navigate('/create-agent');
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md border-border bg-card p-0 overflow-hidden">
        {/* Progress dots */}
        <div className="flex gap-1.5 px-6 pt-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        <div className="px-6 pb-2 pt-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <IconComponent className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">{current.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
        </div>

        <div className="flex gap-2 px-6 pb-6 pt-2">
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} className="flex-1">
              Back
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground">
            Skip tour
          </Button>
          <div className="flex-1" />
          {step < slides.length - 1 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)}>
              Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleCreateAgent}>
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Create an agent
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
