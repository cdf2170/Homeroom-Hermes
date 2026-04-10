import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Plus, PlayCircle, Monitor, Cloud, Zap } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";
import { MOCK_AGENTS } from "@/data/mock-data";

const STATUS_COLORS: Record<string, string> = {
  working: "bg-status-working",
  walking: "bg-status-working",
  idle: "bg-status-idle",
  on_break: "bg-status-break",
  waiting_for_you: "bg-status-waiting",
  paused: "bg-status-idle",
  offline: "bg-status-offline",
  sleeping: "bg-status-sleeping",
  needs_attention: "bg-status-attention",
};

export default function AgentsPage() {
  const { agents, setAgents } = useAgentStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (agents.length === 0) setAgents(MOCK_AGENTS);
  }, []);

  if (agents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-display font-bold">No agents yet</h2>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Create your first agent to get started. They'll show up here once you do.
        </p>
        <Button className="mt-4" onClick={() => navigate("/create")}>
          <Plus className="h-4 w-4 mr-1" /> Create Agent
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Agents</h1>
          <p className="text-muted-foreground mt-0.5">{agents.length} agent{agents.length !== 1 ? "s" : ""} in your office</p>
        </div>
        <Button onClick={() => navigate("/create")}>
          <Plus className="h-4 w-4 mr-1" /> Create Agent
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className="p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate(`/agents/${agent.id}`)}
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                  <div className={`h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[agent.status] || "bg-status-offline"}`} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{agent.purpose}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <Badge variant="outline" className="text-[10px] gap-1">
                {agent.runtimeMode === "local" ? <Monitor className="h-2.5 w-2.5" /> : <Cloud className="h-2.5 w-2.5" />}
                {agent.runtimeMode}
              </Badge>
              {agent.trustPosture !== "ok" && (
                <Badge variant={agent.trustPosture === "critical" ? "attention" : "warning"} className="text-[10px]">
                  {agent.trustPosture}
                </Badge>
              )}
              {agent.scheduleSummary && (
                <Badge variant="secondary" className="text-[10px]">{agent.scheduleSummary}</Badge>
              )}
            </div>

            {agent.lastRunAt && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Last run: {new Date(agent.lastRunAt).toLocaleString()}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
