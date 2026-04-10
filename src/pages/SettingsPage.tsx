import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Cpu, Brain, Shield, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-0.5">Configure your Homeroom environment.</p>
      </div>

      {/* Runtime status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" /> OpenClaw Runtime
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status</span>
            <Badge variant="attention" className="gap-1"><XCircle className="h-3 w-3" /> Not connected</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            OpenClaw is the local runtime that powers your agents. Install it to run agents on your machine.
          </p>
          <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Test connection</Button>
        </CardContent>
      </Card>

      {/* AI Models */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> AI Models
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Set up which AI providers your agents can use. API keys are stored locally on your device.
          </p>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">OpenRouter</p>
              <p className="text-xs text-muted-foreground">Access hundreds of models</p>
            </div>
            <Badge variant="outline">Not configured</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">OpenAI</p>
              <p className="text-xs text-muted-foreground">GPT-4 and more</p>
            </div>
            <Badge variant="outline">Not configured</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Safety defaults */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Safety Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            These defaults apply to new agents. You can override them per agent.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Require approval by default</p>
              <p className="text-xs text-muted-foreground">New agents need approval before acting</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Allow background by default</p>
              <p className="text-xs text-muted-foreground">New agents can run without you starting them</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Allow network access by default</p>
              <p className="text-xs text-muted-foreground">New agents can access the internet</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card className="p-4 bg-muted/30 border-dashed">
        <p className="text-xs text-muted-foreground text-center">
          🔒 All keys and settings are stored locally on your device. Agents can only see what you explicitly allow.
        </p>
      </Card>
    </div>
  );
}
