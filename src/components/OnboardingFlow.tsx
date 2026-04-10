import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding-store";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Home, Bot, Monitor, Cloud, Shield, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

const steps = [
  {
    icon: Home,
    title: "Welcome to Homeroom",
    description: "Your friendly control center for AI agents. Think of it as a cozy office where your digital helpers live, work, and grow.",
    detail: "You'll create agents, give them tasks, shape their personality, and watch them work — all from here.",
  },
  {
    icon: Bot,
    title: "What are agents?",
    description: "Agents are AI helpers you create and customize. Each one has a name, a purpose, personality, memory, and rules.",
    detail: "They're like team members who never sleep. You decide what they do, how they behave, and what they're allowed to access.",
  },
  {
    icon: Monitor,
    title: "Local vs Cloud",
    description: "Your agents can run in two ways:",
    detail: null,
    columns: [
      { icon: Monitor, label: "Local", points: ["Runs on your machine", "Fully private", "Needs local runtime", "Great for getting started"] },
      { icon: Cloud, label: "Cloud", points: ["Uses online AI providers", "More powerful models", "Requires API key setup", "Best for complex tasks"] },
    ],
  },
  {
    icon: Shield,
    title: "You're in control",
    description: "Homeroom starts with safe defaults. Agents need your approval before doing anything risky.",
    detail: "You can review permissions, set boundaries, and change everything later. Nothing runs without your say-so.",
  },
  {
    icon: Sparkles,
    title: "Let's get started!",
    description: "Create your first agent and see what Homeroom can do.",
    detail: "Don't worry about getting everything perfect — you can always adjust settings, add memory, and refine rules later.",
  },
];

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const { markComplete } = useOnboardingStore();
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  return (
    <Dialog open onOpenChange={() => markComplete()}>
      <DialogContent className="sm:max-w-lg">
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-7 w-7 text-primary" />
          </div>

          <DialogTitle className="text-xl font-display font-bold">{current.title}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed max-w-sm">
            {current.description}
          </DialogDescription>

          {current.columns && (
            <div className="grid grid-cols-2 gap-3 w-full mt-2">
              {current.columns.map((col) => (
                <div key={col.label} className="rounded-lg border bg-muted/50 p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <col.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{col.label}</span>
                  </div>
                  <ul className="space-y-1">
                    {col.points.map((p) => (
                      <li key={p} className="text-xs text-muted-foreground">• {p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {current.detail && (
            <p className="text-sm text-muted-foreground max-w-sm">{current.detail}</p>
          )}

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 w-full mt-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={markComplete} className="text-muted-foreground">
              Skip for now
            </Button>
            <Button size="sm" onClick={() => (isLast ? markComplete() : setStep(step + 1))}>
              {isLast ? "Get started" : "Next"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
