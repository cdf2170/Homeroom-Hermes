import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Bot, Monitor, Cloud, Shield, Clock, PlayCircle, ArrowLeft,
  Heart, Lightbulb, Bookmark, Bell, AlertTriangle, Lock, Star,
  Plus, Pin, ToggleLeft, ChevronUp, ChevronDown, Sparkles,
  Brain, Eye, Wrench, Settings2,
} from "lucide-react";
import { useAgentStore, type MemoryItem, type RuleItem } from "@/store/agent-store";
import { MOCK_AGENTS, MOCK_MEMORY_ITEMS, MOCK_RULE_ITEMS, MOCK_RUNS, MOCK_FINDINGS, MOCK_PERMISSIONS, MOCK_SCHEDULES } from "@/data/mock-data";

const MEMORY_ICONS: Record<string, typeof Heart> = { preference: Heart, fact: Lightbulb, context: Bookmark, reminder: Bell };
const MEMORY_COLORS: Record<string, string> = { preference: "border-l-pink-400", fact: "border-l-amber-400", context: "border-l-blue-400", reminder: "border-l-purple-400" };
const RULE_ICONS: Record<string, typeof Shield> = { safety: Shield, preference: Star, hard_rule: Lock };

export default function AgentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agents, setAgents } = useAgentStore();

  useEffect(() => {
    if (agents.length === 0) setAgents(MOCK_AGENTS);
  }, []);

  const agent = agents.find((a) => a.id === id);
  const memories = MOCK_MEMORY_ITEMS.filter((m) => m.agentId === id);
  const rules = MOCK_RULE_ITEMS.filter((r) => r.agentId === id);
  const runs = MOCK_RUNS.filter((r) => r.agentId === id);
  const findings = MOCK_FINDINGS.filter((f) => f.targetId === id);
  const permission = MOCK_PERMISSIONS.find((p) => p.agentId === id);
  const schedule = MOCK_SCHEDULES.find((s) => s.agentId === id);

  if (!agent) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground">Agent not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/agents")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to agents
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/agents")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold">{agent.name}</h1>
            <Badge variant={agent.enabled ? "success" : "outline"}>
              {agent.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5">{agent.purpose}</p>
        </div>
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* At a glance strip */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1">
          {agent.runtimeMode === "local" ? <Monitor className="h-3 w-3" /> : <Cloud className="h-3 w-3" />}
          {agent.runtimeMode === "local" ? "Runs locally" : agent.runtimeMode === "cloud" ? "Uses cloud AI" : "Hybrid"}
        </Badge>
        <Badge variant="outline" className="gap-1">
          {agent.backgroundEnabled ? "Background" : "Manual only"}
        </Badge>
        <Badge variant={agent.trustPosture === "ok" ? "success" : agent.trustPosture === "critical" ? "attention" : "warning"} className="gap-1">
          <Shield className="h-3 w-3" />
          {agent.trustPosture === "ok" ? "All clear" : agent.trustPosture}
        </Badge>
        {permission?.networkAccess && (
          <Badge variant="outline" className="gap-1">Internet access</Badge>
        )}
        {schedule && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> {schedule.plainEnglish}
          </Badge>
        )}
        {agent.lastRunAt && (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            Last run: {new Date(agent.lastRunAt).toLocaleString()}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          {["Overview", "Memory", "Rules", "Activity", "Tools", "Schedule", "Advanced"].map((tab) => (
            <TabsTrigger key={tab} value={tab.toLowerCase()} className="data-[state=active]:bg-muted">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Archetype</span><span className="capitalize">{agent.archetype}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vibe</span><span className="capitalize">{agent.vibe}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Intelligence</span><span className="capitalize">{agent.smartnessLevel}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span className="capitalize">{agent.sceneRoomId.replace(/_/g, " ")}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Safety Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Safety level</span><span className="capitalize">{permission?.safetyLevel || "strict"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Network access</span><span>{permission?.networkAccess ? "Yes" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Background</span><span>{agent.backgroundEnabled ? "Yes" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Requires approval</span><span>{permission?.requiresApprovalFor.length ? "Yes" : "No"}</span></div>
              </CardContent>
            </Card>
          </div>

          {findings.length > 0 && (
            <Card className="border-status-waiting/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-status-waiting" />
                  Findings
                </CardTitle>
                <CardDescription>Based on your current settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {findings.map((f) => (
                  <div key={f.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.detail}</p>
                    {f.recommendedAction && (
                      <p className="text-xs text-primary mt-1">→ {f.recommendedAction}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Memory */}
        <TabsContent value="memory" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Memory</h3>
              <p className="text-xs text-muted-foreground">Things this agent should remember about you and your preferences.</p>
            </div>
            <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Add memory</Button>
          </div>
          {memories.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">No memories yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Add things this agent should remember — like your preferences, important facts, or standing context.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["My timezone is PST", "I prefer concise answers", "I work in product design"].map((ex) => (
                  <Button key={ex} variant="secondary" size="sm" className="text-xs">{ex}</Button>
                ))}
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {memories.map((mem) => {
                const Icon = MEMORY_ICONS[mem.category] || Bookmark;
                return (
                  <Card key={mem.id} className={`p-4 border-l-4 ${MEMORY_COLORS[mem.category] || ""}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{mem.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] capitalize">{mem.category}</Badge>
                          {mem.pinned && <Pin className="h-3 w-3 text-primary" />}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Rules */}
        <TabsContent value="rules" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Rules & Boundaries</h3>
              <p className="text-xs text-muted-foreground">Set clear limits for what this agent should and shouldn't do.</p>
            </div>
            <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Add rule</Button>
          </div>
          {rules.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Shield className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">No rules yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Add boundaries to keep this agent predictable and safe. Rules help your agent understand your expectations.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["Never share data publicly", "Always ask before sending", "Use formal tone"].map((ex) => (
                  <Button key={ex} variant="secondary" size="sm" className="text-xs">{ex}</Button>
                ))}
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => {
                const Icon = RULE_ICONS[rule.category] || Shield;
                return (
                  <Card key={rule.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                        rule.category === "safety" ? "text-status-attention" :
                        rule.category === "hard_rule" ? "text-status-working" :
                        "text-muted-foreground"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{rule.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={rule.category === "safety" ? "attention" : rule.category === "hard_rule" ? "success" : "secondary"} className="text-[10px] capitalize">
                            {rule.category.replace("_", " ")}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">Priority {rule.priority}</span>
                        </div>
                      </div>
                      <Switch checked={rule.enabled} className="shrink-0" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <h3 className="font-semibold text-sm">Run History</h3>
          {runs.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <PlayCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">No runs yet</p>
              <p className="text-xs text-muted-foreground mt-1">Run this agent once to see what it can do.</p>
              <Button className="mt-4" size="sm"><PlayCircle className="h-3.5 w-3.5 mr-1" /> Run now</Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <Card key={run.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${
                      run.status === "completed" ? "bg-status-working" :
                      run.status === "running" ? "bg-status-waiting animate-pulse" :
                      run.status === "failed" ? "bg-status-attention" :
                      "bg-status-idle"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{run.inputSummary}</p>
                      {run.outputSummary && <p className="text-xs text-muted-foreground mt-0.5">{run.outputSummary}</p>}
                      {run.errorSummary && <p className="text-xs text-status-attention mt-0.5">{run.errorSummary}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="capitalize">{run.trigger}</span>
                        <span className="capitalize">{run.status}</span>
                        {run.durationMs && <span>{(run.durationMs / 1000).toFixed(0)}s</span>}
                        {run.modelUsed && <span>{run.modelUsed}</span>}
                        <span>{new Date(run.startedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tools */}
        <TabsContent value="tools" className="space-y-4 mt-4">
          <h3 className="font-semibold text-sm">Tools & Permissions</h3>
          {!permission ? (
            <Card className="p-8 text-center border-dashed">
              <Wrench className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">No tools configured</p>
              <p className="text-xs text-muted-foreground mt-1">Set up what this agent can access.</p>
              <Button variant="outline" className="mt-4" size="sm">Configure tools</Button>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Safety level</span><Badge variant="outline" className="capitalize">{permission.safetyLevel}</Badge></div>
                <Separator />
                <div><p className="text-muted-foreground text-xs mb-1">Tool access</p><div className="flex flex-wrap gap-1">{permission.toolScopes.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}</div></div>
                <div><p className="text-muted-foreground text-xs mb-1">Data access</p><div className="flex flex-wrap gap-1">{permission.dataScopes.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}</div></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">Network access</span><span>{permission.networkAccess ? "Yes" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Requires approval for</span><span className="text-right">{permission.requiresApprovalFor.join(", ") || "Nothing"}</span></div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          <h3 className="font-semibold text-sm">Schedule</h3>
          {!schedule ? (
            <Card className="p-8 text-center border-dashed">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">Running manually</p>
              <p className="text-xs text-muted-foreground mt-1">Set a schedule to let this agent work on its own.</p>
              <Button variant="outline" className="mt-4" size="sm">Set schedule</Button>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Schedule</span><span>{schedule.plainEnglish}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Enabled</span><Switch checked={schedule.enabled} /></div>
                {schedule.nextRunAt && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Next run</span><span>{new Date(schedule.nextRunAt).toLocaleString()}</span></div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card className="p-4 bg-muted/30 border-dashed">
            <div className="flex items-start gap-3">
              <Settings2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Advanced Settings</p>
                <p className="text-xs text-muted-foreground mt-0.5">Most people won't need to change these.</p>
              </div>
            </div>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Agent ID</span><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{agent.id}</code></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{new Date(agent.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span>{new Date(agent.updatedAt).toLocaleString()}</span></div>
              <Separator />
              <Button variant="destructive" size="sm">Delete agent</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
