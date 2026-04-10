import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, AlertTriangle, CheckCircle2, ArrowRight,
  Bot, Shield, Plug, Brain, Clock, PlayCircle, Plus,
} from "lucide-react";
import { MOCK_AGENTS, MOCK_RUNS, MOCK_FINDINGS, MOCK_AUDIT_EVENTS } from "@/data/mock-data";
import { useAgentStore } from "@/store/agent-store";

const SETUP_STEPS = [
  { key: "first_agent", label: "Create your first agent", done: true, path: "/create" },
  { key: "runtime", label: "Connect OpenClaw runtime", done: false, path: "/connections" },
  { key: "models", label: "Set up AI models", done: false, path: "/connections" },
  { key: "safety", label: "Review safety settings", done: false, path: "/safety" },
  { key: "first_run", label: "Run a test task", done: false, path: "/agents" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { agents, setAgents } = useAgentStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (agents.length === 0) setAgents(MOCK_AGENTS);
  }, []);

  const activeAgents = agents.filter((a) => a.status === "working" || a.status === "walking");
  const needsAttention = agents.filter((a) => a.trustPosture === "warning" || a.trustPosture === "critical");
  const recentRuns = MOCK_RUNS.slice(0, 3);
  const findings = MOCK_FINDINGS.filter((f) => f.level !== "ok");
  const completedSteps = SETUP_STEPS.filter((s) => s.done).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-display font-bold">{getGreeting()} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your office today.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Agents", value: agents.length, icon: Bot },
          { label: "Active now", value: activeAgents.length, icon: PlayCircle },
          { label: "Needs attention", value: needsAttention.length, icon: AlertTriangle },
          { label: "Total runs", value: MOCK_RUNS.length, icon: Clock },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Setup checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Complete these steps to get the most out of Homeroom.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={completedSteps} max={SETUP_STEPS.length} className="h-2" />
          <p className="text-xs text-muted-foreground">{completedSteps} of {SETUP_STEPS.length} complete</p>
          <div className="space-y-2">
            {SETUP_STEPS.map((step) => (
              <button
                key={step.key}
                onClick={() => navigate(step.path)}
                className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 ${step.done ? "text-status-working" : "text-muted-foreground/30"}`}
                />
                <span className={`text-sm ${step.done ? "line-through text-muted-foreground" : ""}`}>
                  {step.label}
                </span>
                {!step.done && <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Needs attention */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-waiting" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {needsAttention.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-status-working" />
                <p className="text-sm font-medium">Everything looks good!</p>
                <p className="text-xs mt-1">All your agents are running smoothly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {needsAttention.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="flex items-center gap-3 w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {agent.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.purpose}</p>
                    </div>
                    <Badge variant={agent.trustPosture === "critical" ? "attention" : "warning"}>
                      {agent.trustPosture}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_AUDIT_EVENTS.slice(0, 4).map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                    event.eventType.includes("failed") ? "bg-status-attention" :
                    event.eventType.includes("completed") ? "bg-status-working" :
                    "bg-status-idle"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{event.targetName}</span>{" "}
                      <span className="text-muted-foreground">{event.summary}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggested next actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Suggested Next Steps</CardTitle>
          <CardDescription>
            Here are some things you might want to do.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Create an agent", icon: Plus, path: "/create" },
              { label: "Review safety", icon: Shield, path: "/safety" },
              { label: "Connect a tool", icon: Plug, path: "/connections" },
              { label: "Set up AI models", icon: Brain, path: "/connections" },
            ].map((action) => (
              <Button key={action.label} variant="outline" size="sm" onClick={() => navigate(action.path)}>
                <action.icon className="h-3.5 w-3.5 mr-1.5" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
