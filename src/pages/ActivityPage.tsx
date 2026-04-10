import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_AUDIT_EVENTS } from "@/data/mock-data";

const TYPE_COLORS: Record<string, string> = {
  "run.completed": "bg-status-working",
  "run.started": "bg-status-waiting",
  "run.failed": "bg-status-attention",
  "agent.enabled": "bg-primary",
  "agent.disabled": "bg-status-offline",
  "agent.created": "bg-primary",
};

export default function ActivityPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Activity</h1>
        <p className="text-muted-foreground mt-0.5">Everything that's happened across your office.</p>
      </div>

      <div className="space-y-3">
        {MOCK_AUDIT_EVENTS.map((event) => (
          <Card key={event.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${TYPE_COLORS[event.eventType] || "bg-status-idle"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{event.targetName}</span>
                  <Badge variant="secondary" className="text-[10px]">{event.eventType}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{event.summary}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
