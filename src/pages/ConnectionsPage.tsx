import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Plug, Search, ExternalLink, Monitor, Cloud, Shield, CheckCircle2,
  Bot, Brain, Calendar, Mail, MessageSquare, Github, FileText,
  Home as HomeIcon, Globe, Send, Cpu, Key, Sparkles,
} from "lucide-react";

interface Plugin {
  id: string; name: string; category: string; description: string;
  safetyLabel: "Safe" | "Review recommended" | "Advanced";
  type: "local" | "cloud" | "local-or-cloud";
  setupMethod: string; icon: typeof Bot;
  capabilities: string; access: string; microcopy: string;
}

const PLUGINS: Plugin[] = [
  { id: "openclaw", name: "OpenClaw Runtime", category: "Core", description: "Local AI agent runtime — the engine that powers your agents", safetyLabel: "Safe", type: "local", setupMethod: "local-connection", icon: Cpu, capabilities: "Run agents locally with full privacy", access: "Full local system access for agent execution", microcopy: "This is the heart of Homeroom. Start here." },
  { id: "openrouter", name: "OpenRouter", category: "AI Providers", description: "Access hundreds of AI models through one API", safetyLabel: "Review recommended", type: "cloud", setupMethod: "api-key", icon: Brain, capabilities: "Use GPT-4, Claude, Llama, and more", access: "Sends prompts to cloud AI providers", microcopy: "Great for trying different models without separate accounts." },
  { id: "openai", name: "OpenAI", category: "AI Providers", description: "Direct access to GPT-4 and other OpenAI models", safetyLabel: "Review recommended", type: "cloud", setupMethod: "api-key", icon: Sparkles, capabilities: "Use GPT-4, GPT-4o, and DALL-E", access: "Sends data to OpenAI's servers", microcopy: "Best if you already have an OpenAI account." },
  { id: "anthropic", name: "Anthropic", category: "AI Providers", description: "Access Claude models for thoughtful, careful responses", safetyLabel: "Review recommended", type: "cloud", setupMethod: "api-key", icon: Brain, capabilities: "Use Claude for analysis and writing", access: "Sends data to Anthropic's servers", microcopy: "Known for careful, well-reasoned responses." },
  { id: "google-calendar", name: "Google Calendar", category: "Productivity", description: "Let agents check and manage your calendar", safetyLabel: "Safe", type: "cloud", setupMethod: "oauth", icon: Calendar, capabilities: "Read events, create reminders, check availability", access: "Read and write access to your Google Calendar", microcopy: "Perfect for organizer agents." },
  { id: "gmail", name: "Gmail", category: "Productivity", description: "Let agents read and draft emails", safetyLabel: "Review recommended", type: "cloud", setupMethod: "oauth", icon: Mail, capabilities: "Read emails, draft replies, organize inbox", access: "Read and write access to your Gmail", microcopy: "Agents can draft but won't send without approval." },
  { id: "slack", name: "Slack", category: "Communication", description: "Send notifications and read messages in Slack", safetyLabel: "Review recommended", type: "cloud", setupMethod: "oauth", icon: MessageSquare, capabilities: "Post messages, read channels, send alerts", access: "Access to selected Slack channels", microcopy: "Great for keeping your team updated." },
  { id: "github", name: "GitHub", category: "Developer Tools", description: "Review PRs, check issues, and manage repos", safetyLabel: "Advanced", type: "cloud", setupMethod: "oauth", icon: Github, capabilities: "Read repos, review PRs, comment on issues", access: "Read and optional write access to repositories", microcopy: "Start with read-only access and expand as needed." },
  { id: "notion", name: "Notion", category: "Productivity", description: "Read and update your Notion workspace", safetyLabel: "Review recommended", type: "cloud", setupMethod: "oauth", icon: FileText, capabilities: "Read pages, update databases, create entries", access: "Access to selected Notion pages", microcopy: "Helpful for research and knowledge management agents." },
  { id: "local-files", name: "Local Files", category: "Files & Storage", description: "Let agents read and write files on your machine", safetyLabel: "Safe", type: "local", setupMethod: "local-connection", icon: FileText, capabilities: "Read, create, and organize local files", access: "Access to folders you explicitly allow", microcopy: "You choose exactly which folders to share." },
  { id: "home-assistant", name: "Home Assistant", category: "Home / Automation", description: "Control smart home devices through Home Assistant", safetyLabel: "Advanced", type: "local-or-cloud", setupMethod: "api-key", icon: HomeIcon, capabilities: "Toggle devices, read sensors, trigger automations", access: "Control over connected smart home devices", microcopy: "For advanced users with existing Home Assistant setups." },
  { id: "web-browser", name: "Web Browser", category: "Research", description: "Let agents browse the web to find information", safetyLabel: "Review recommended", type: "cloud", setupMethod: "built-in", icon: Globe, capabilities: "Search the web, read pages, extract data", access: "Outbound internet access for browsing", microcopy: "Essential for research and watcher agents." },
  { id: "telegram", name: "Telegram", category: "Communication", description: "Send and receive messages via Telegram bot", safetyLabel: "Advanced", type: "cloud", setupMethod: "api-key", icon: Send, capabilities: "Send messages, receive commands, share files", access: "Telegram bot API access", microcopy: "Create a bot in Telegram and paste its token." },
];

const RECOMMENDED = ["openclaw", "local-files", "google-calendar", "openrouter"];
const SAFETY_STYLES = { Safe: "success" as const, "Review recommended": "warning" as const, Advanced: "attention" as const };

export default function ConnectionsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Plugin | null>(null);

  const filtered = PLUGINS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );
  const recommended = PLUGINS.filter((p) => RECOMMENDED.includes(p.id));
  const categories = [...new Set(filtered.map((p) => p.category))];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Plug className="h-6 w-6 text-primary" /> Connections
        </h1>
        <p className="text-muted-foreground mt-1">Invite useful tools into your office.</p>
      </div>

      {/* Recommended */}
      <Card className="p-5 bg-primary/5 border-primary/20">
        <p className="text-sm font-semibold mb-3">✨ Most people start with...</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {recommended.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="flex items-center gap-2 p-3 rounded-lg bg-background border hover:border-primary/40 hover:shadow-sm transition-all text-left">
              <p.icon className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{p.name}</p>
                <Badge variant="success" className="text-[9px] mt-0.5">Recommended</Badge>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search connections..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.filter((p) => p.category === cat).map((p) => (
              <Card key={p.id} className="p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelected(p)}>
                <div className="flex items-start gap-3">
                  <p.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge variant={SAFETY_STYLES[p.safetyLabel]} className="text-[10px]">{p.safetyLabel}</Badge>
                      <Badge variant="outline" className="text-[10px] gap-0.5">
                        {p.type === "local" ? <Monitor className="h-2.5 w-2.5" /> : <Cloud className="h-2.5 w-2.5" />}
                        {p.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <selected.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <SheetTitle>{selected.name}</SheetTitle>
                    <SheetDescription>{selected.category}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <Badge variant={SAFETY_STYLES[selected.safetyLabel]}>{selected.safetyLabel}</Badge>
                <p className="text-sm">{selected.description}</p>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">What agents can do</p>
                  <p className="text-sm">{selected.capabilities}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">What access this gives</p>
                  <p className="text-sm">{selected.access}</p>
                </div>
                <Card className="p-3 bg-muted/50 text-xs text-muted-foreground">
                  {selected.type === "local"
                    ? "🔒 Runs locally on your machine. Your data stays private."
                    : "☁️ Sends data to an online service. Review what access you're granting."}
                </Card>
                <p className="text-sm text-muted-foreground italic">{selected.microcopy}</p>
                <Separator />
                <Button className="w-full">
                  <Key className="h-4 w-4 mr-1" /> Set up {selected.name}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  {selected.setupMethod === "api-key" ? "You'll paste an API key. It's stored locally on your device." :
                   selected.setupMethod === "oauth" ? "You'll sign in with your account. Homeroom only gets the access you approve." :
                   selected.setupMethod === "local-connection" ? "Connects to software already running on your machine." :
                   "Works out of the box — no setup needed."}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
