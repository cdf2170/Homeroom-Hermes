import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, AlertTriangle, Info, Bot, ArrowRight } from "lucide-react";
import { MOCK_FINDINGS, MOCK_AGENTS } from "@/data/mock-data";

function getOverallPosture() {
  if (MOCK_FINDINGS.some((f) => f.level === "critical")) return { label: "At Risk", variant: "attention" as const, icon: AlertTriangle };
  if (MOCK_FINDINGS.some((f) => f.level === "warning")) return { label: "Needs Review", variant: "warning" as const, icon: AlertTriangle };
  return { label: "All Clear", variant: "success" as const, icon: CheckCircle2 };
}

const LEVEL_STYLES: Record<string, { variant: "success" | "warning" | "attention"; icon: typeof Info }> = {
  ok: { variant: "success", icon: CheckCircle2 },
  info: { variant: "success", icon: Info },
  warning: { variant: "warning", icon: AlertTriangle },
  critical: { variant: "attention", icon: AlertTriangle },
};

export default function SafetyPage() {
  const navigate = useNavigate();
  const posture = getOverallPosture();
  const PostureIcon = posture.icon;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Safety</h1>
          <p className="text-muted-foreground mt-0.5">Review the safety posture of your agents and office.</p>
        </div>
      </div>

      {/* Overall posture */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
            posture.variant === "success" ? "bg-status-working/15" :
            posture.variant === "warning" ? "bg-status-waiting/15" :
            "bg-status-attention/15"
          }`}>
            <PostureIcon className={`h-7 w-7 ${
              posture.variant === "success" ? "text-status-working" :
              posture.variant === "warning" ? "text-status-waiting" :
              "text-status-attention"
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-bold">{posture.label}</h2>
              <Badge variant={posture.variant}>{MOCK_FINDINGS.length} finding{MOCK_FINDINGS.length !== 1 ? "s" : ""}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Based on your current settings. {posture.label === "All Clear"
                ? "No issues detected in Homeroom."
                : "Review the findings below to improve your safety posture."}
            </p>
          </div>
        </div>
      </Card>

      {/* Findings */}
      <div className="space-y-3">
        {MOCK_FINDINGS.map((finding) => {
          const style = LEVEL_STYLES[finding.level] || LEVEL_STYLES.info;
          const LevelIcon = style.icon;
          const agent = finding.targetId ? MOCK_AGENTS.find((a) => a.id === finding.targetId) : null;

          return (
            <Card key={finding.id} className="p-4">
              <div className="flex items-start gap-3">
                <LevelIcon className={`h-5 w-5 mt-0.5 shrink-0 ${
                  finding.level === "critical" ? "text-status-attention" :
                  finding.level === "warning" ? "text-status-waiting" :
                  "text-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{finding.title}</p>
                    <Badge variant={style.variant} className="text-[10px]">{finding.level}</Badge>
                    {agent && <Badge variant="outline" className="text-[10px] gap-1"><Bot className="h-2.5 w-2.5" />{agent.name}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{finding.detail}</p>
                  {finding.recommendedAction && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs h-7 text-primary"
                      onClick={() => agent && navigate(`/agents/${agent.id}`)}
                    >
                      → {finding.recommendedAction}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
