import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, Plus, Shield, Eye, HelpCircle, Monitor, Cloud } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";
import { MOCK_AGENTS } from "@/data/mock-data";

const ROOMS: Record<string, { label: string; desc: string; color: string }> = {
  focus_room: { label: "Work Area", desc: "Actively working on tasks", color: "bg-status-working/20" },
  break_room: { label: "Break Room", desc: "Taking a break", color: "bg-status-break/20" },
  help_desk: { label: "Help Desk", desc: "Waiting for your input", color: "bg-status-waiting/20" },
  automation_room: { label: "Automation Hub", desc: "Running scheduled tasks", color: "bg-primary/10" },
  local_compute_room: { label: "Local Room", desc: "Runs on your device", color: "bg-muted" },
  cloud_room: { label: "Cloud Room", desc: "Using online AI models", color: "bg-window/20" },
  lounge: { label: "Lounge", desc: "Resting or sleeping", color: "bg-status-sleeping/20" },
};

export default function OfficePage() {
  const { agents, setAgents } = useAgentStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (agents.length === 0) setAgents(MOCK_AGENTS);
  }, []);

  const roomGroups = Object.entries(ROOMS).map(([id, room]) => ({
    ...room,
    id,
    agents: agents.filter((a) => a.sceneRoomId === id),
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Live Office</h1>
          <p className="text-muted-foreground mt-0.5">See where your agents are and what they're doing.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/safety")}>
            <Shield className="h-3.5 w-3.5 mr-1" /> Safety
          </Button>
          <Button size="sm" onClick={() => navigate("/create")}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Create Agent
          </Button>
        </div>
      </div>

      {/* Room legend */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Room Guide</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(ROOMS).map(([id, room]) => (
            <div key={id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`h-3 w-3 rounded ${room.color}`} />
              <span>{room.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Office grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roomGroups.map((room) => (
          <Card key={room.id} className={`p-4 ${room.color} border`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{room.label}</h3>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{room.desc}</TooltipContent>
              </Tooltip>
            </div>
            {room.agents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3">Empty</p>
            ) : (
              <div className="space-y-2">
                {room.agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="flex items-center gap-2 w-full p-2 rounded-lg bg-background/60 hover:bg-background transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{agent.status.replace(/_/g, " ")}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] gap-0.5">
                      {agent.runtimeMode === "local" ? <Monitor className="h-2.5 w-2.5" /> : <Cloud className="h-2.5 w-2.5" />}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
