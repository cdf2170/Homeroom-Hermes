import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, ArrowLeft, Sparkles, CheckCircle2,
  Search, Wrench, Eye, HelpCircle, MessageSquare, Bot,
  Monitor, Cloud, Zap, Brain, Shield,
} from "lucide-react";
import { useAgentStore } from "@/store/agent-store";

const ARCHETYPES = [
  { id: "researcher", label: "Research Assistant", icon: Search, desc: "Finds sources, compares options, summarizes clearly" },
  { id: "organizer", label: "Organizer", icon: Wrench, desc: "Manages schedules, sorts tasks, keeps things tidy" },
  { id: "builder", label: "Builder", icon: Zap, desc: "Writes code, generates content, creates artifacts" },
  { id: "watcher", label: "Watcher", icon: Eye, desc: "Monitors updates, alerts you to important changes" },
  { id: "helper", label: "Helper", icon: HelpCircle, desc: "Answers questions, provides guidance, assists with tasks" },
  { id: "messenger", label: "Messenger", icon: MessageSquare, desc: "Sends notifications, drafts messages, manages communication" },
];

const SMART_LEVELS = [
  { id: "basic", label: "Basic", desc: "Fast and simple. Great for routine tasks." },
  { id: "standard", label: "Standard", desc: "Good balance of speed and capability.", recommended: true },
  { id: "advanced", label: "Advanced", desc: "Most capable. Best for complex reasoning." },
];

const steps = ["Name & Purpose", "Role", "Intelligence", "Safety", "Done!"];

export default function CreateAgentPage() {
  const navigate = useNavigate();
  const addAgent = useAgentStore((s) => s.addAgent);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    purpose: "",
    archetype: "helper",
    smartnessLevel: "standard",
    runtimeMode: "local",
    backgroundEnabled: false,
    requiresApproval: true,
  });

  const canProceed = step === 0 ? form.name.trim().length > 0 : true;
  const createdId = `a${Date.now()}`;

  function handleCreate() {
    const agent = {
      id: createdId,
      name: form.name,
      purpose: form.purpose,
      archetype: form.archetype,
      vibe: "calm",
      status: "idle" as const,
      enabled: false,
      backgroundEnabled: form.backgroundEnabled,
      runtimeMode: form.runtimeMode,
      smartnessLevel: form.smartnessLevel,
      sceneRoomId: "focus_room",
      lastRunAt: null,
      lastRunStatus: null,
      scheduleSummary: null,
      trustPosture: "ok",
      permissionProfileId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addAgent(agent);
    setStep(4);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold">Create Agent</h1>
        <p className="text-muted-foreground mt-1">Set up a new member for your office team.</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? "bg-status-working text-white" :
                i === step ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 ${i < step ? "bg-status-working" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{steps[step]}</p>
      </div>

      {/* Step 1: Name & Purpose */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">What should we call this agent?</Label>
                <Input
                  id="name"
                  placeholder="e.g., Scout, Pepper, Bolt..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={64}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">What will it help with?</Label>
                <Textarea
                  id="purpose"
                  placeholder="e.g., Find relevant articles about topics I care about..."
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">You can always change this later.</p>
              </div>
            </div>
            {/* Avatar preview */}
            <div className="hidden sm:flex flex-col items-center gap-2 shrink-0">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">
                {form.name || "Your agent"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Role */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Choose a role that matches what this agent will do.</p>
          <div className="grid grid-cols-2 gap-3">
            {ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                onClick={() => setForm({ ...form, archetype: arch.id })}
                className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ${
                  form.archetype === arch.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <arch.icon className={`h-5 w-5 mt-0.5 shrink-0 ${form.archetype === arch.id ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium text-sm">{arch.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{arch.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Intelligence & Runtime */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label>How smart should it be?</Label>
            <div className="space-y-2">
              {SMART_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setForm({ ...form, smartnessLevel: level.id })}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-colors ${
                    form.smartnessLevel === level.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Brain className={`h-4 w-4 shrink-0 ${form.smartnessLevel === level.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{level.label}</span>
                      {level.recommended && <Badge variant="success" className="text-[10px]">Recommended</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{level.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Where does it run?</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "local", label: "Local", icon: Monitor, points: ["Runs on your machine", "Fully private", "Needs OpenClaw"] },
                { id: "cloud", label: "Cloud", icon: Cloud, points: ["Uses online AI", "More powerful", "Needs API key"] },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setForm({ ...form, runtimeMode: mode.id })}
                  className={`flex flex-col gap-2 p-4 rounded-lg border text-left transition-colors ${
                    form.runtimeMode === mode.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <mode.icon className={`h-4 w-4 ${form.runtimeMode === mode.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-medium text-sm">{mode.label}</span>
                  </div>
                  <ul className="space-y-1">
                    {mode.points.map((p) => (
                      <li key={p} className="text-xs text-muted-foreground">• {p}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Safety */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="p-4 bg-muted/30 border-dashed">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Safe defaults are enabled</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your agent starts with safe settings. You can adjust these anytime from the agent's profile.
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Run in background?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Let this agent work without you starting it manually.
                </p>
              </div>
              <Switch
                checked={form.backgroundEnabled}
                onCheckedChange={(v) => setForm({ ...form, backgroundEnabled: v })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Require approval for actions?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Agent asks before doing anything that could change files or send messages.
                </p>
              </div>
              <Switch
                checked={form.requiresApproval}
                onCheckedChange={(v) => setForm({ ...form, requiresApproval: v })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 4 && (
        <div className="text-center space-y-6 py-8">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-status-working/15 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-status-working" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">{form.name} is ready!</h2>
            <p className="text-muted-foreground mt-1">Your new agent has been created with safe defaults.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/agents/${createdId}`)}>
              Open profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/agents")}>
              View all agents
            </Button>
            <Button size="sm" onClick={() => navigate("/create")}>
              Create another
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="flex items-center gap-3 mt-8">
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={!form.name.trim()}>
              <Sparkles className="h-4 w-4 mr-1" /> Create Agent
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
