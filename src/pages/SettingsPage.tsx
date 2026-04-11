import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Shield, Cpu, Cloud, RefreshCw, Brain, Key, Eye, EyeOff, Trash2, Check, ExternalLink,
  Wand2, Info, Plug, Search, Calendar, Mail, MessageSquare, Globe,
  FileText, Database, Bell, GitBranch, ChevronRight, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { completeOnboarding } from './OnboardingPage';
import ModelSetupWizard from '@/components/ModelSetupWizard';
import { useModelConfig, useModelStore, hasProviderKey, setProviderKey, removeProviderKey, getProviderKey } from '@/store/modelConfigStore';
import { SETUP_OPTIONS, SMART_PRESETS } from '@/types/modelConfig';
import { PROVIDER_INFO } from '@/data/models';
import { toast } from 'sonner';

// ── Provider Key Row for Settings ──
const ProviderKeyRow: React.FC<{ providerKey: string; info: typeof PROVIDER_INFO[string] }> = ({ providerKey, info }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const existing = getProviderKey(providerKey);
  const connected = hasProviderKey(providerKey);
  const masked = existing ? existing.slice(0, 6) + '\u2022\u2022\u2022' + existing.slice(-4) : '';

  const handleSave = () => {
    if (!value.trim()) return;
    setProviderKey(providerKey, value.trim());
    toast.success(`${info.name} key saved`);
    setEditing(false);
    setValue('');
  };

  return (
    <div className="p-3 bg-muted rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono font-bold text-muted-foreground bg-background px-1.5 py-0.5 rounded">{info.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{info.name}</p>
            {connected ? (
              <p className="text-[10px] text-muted-foreground font-mono truncate">{masked}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground">Not connected</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {connected && (
            <Badge variant="default" className="text-[10px] bg-status-working/15 text-status-working border-none">Connected</Badge>
          )}
          {connected ? (
            <>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(!editing)}>
                {editing ? 'Cancel' : 'Update'}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => { removeProviderKey(providerKey); toast.success(`${info.name} key removed`); }}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(true)}>
              Add Key
            </Button>
          )}
        </div>
      </div>
      {editing && (
        <div className="mt-2 space-y-2">
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder={info.keyPlaceholder || 'Paste your API key'}
              value={value}
              onChange={e => setValue(e.target.value)}
              className="h-8 text-xs font-mono pr-8"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <a href={info.keyUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
              Get your key <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={!value.trim()}>
              <Check className="w-3 h-3" /> Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Inline help tooltip ──
const HelpTip: React.FC<{ text: string }> = ({ text }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3 h-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// ── Setting row with rich description ──
const SettingRow: React.FC<{
  label: string;
  description: string;
  detail: string;
  children: React.ReactNode;
}> = ({ label, description, detail, children }) => (
  <div className="flex items-start justify-between gap-4 py-1">
    <div className="space-y-0.5 min-w-0">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        <HelpTip text={detail} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
    <div className="shrink-0 pt-0.5">{children}</div>
  </div>
);
// ── Plugin data ──
type PluginStatus = 'available' | 'connected' | 'coming-soon';
type PluginCategory = 'productivity' | 'communication' | 'ai-providers' | 'data' | 'dev-tools';

interface PluginDef {
  id: string;
  name: string;
  description: string;
  helpText: string;
  icon: React.ElementType;
  category: PluginCategory;
  status: PluginStatus;
  setupLabel: string;
  tags?: string[];
}

const PLUGINS: PluginDef[] = [
  { id: 'google-calendar', name: 'Google Calendar', description: 'Let agents check your schedule and create events', helpText: 'Connect with your Google account.', icon: Calendar, category: 'productivity', status: 'available', setupLabel: 'Connect', tags: ['popular'] },
  { id: 'google-docs', name: 'Google Docs', description: 'Read and write documents through your agents', helpText: 'Give agents access to Google Docs.', icon: FileText, category: 'productivity', status: 'coming-soon', setupLabel: 'Connect' },
  { id: 'notion', name: 'Notion', description: 'Search, read, and update your Notion workspace', helpText: 'Connect your Notion workspace.', icon: Database, category: 'productivity', status: 'available', setupLabel: 'Add API key', tags: ['popular'] },
  { id: 'gmail', name: 'Gmail', description: 'Draft and send emails on your behalf', helpText: 'Connect Gmail for email access.', icon: Mail, category: 'communication', status: 'available', setupLabel: 'Connect', tags: ['popular'] },
  { id: 'slack', name: 'Slack', description: 'Post messages and read channels', helpText: 'Add Homeroom bot to Slack.', icon: MessageSquare, category: 'communication', status: 'available', setupLabel: 'Add to Slack' },
  { id: 'discord', name: 'Discord', description: 'Send messages and monitor server activity', helpText: 'Add Homeroom bot to Discord.', icon: MessageSquare, category: 'communication', status: 'coming-soon', setupLabel: 'Add to Discord' },
  { id: 'webhooks', name: 'Webhooks', description: 'Trigger agents from any external service', helpText: 'Create webhook URLs for automation.', icon: Bell, category: 'communication', status: 'available', setupLabel: 'Create webhook' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o, o1, and other OpenAI models', helpText: 'Add your OpenAI API key.', icon: Brain, category: 'ai-providers', status: 'available', setupLabel: 'Add API key', tags: ['popular'] },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5, Claude 4, and Haiku', helpText: 'Add your Anthropic API key.', icon: Brain, category: 'ai-providers', status: 'available', setupLabel: 'Add API key', tags: ['popular'] },
  { id: 'google-ai', name: 'Google AI', description: 'Gemini 2.5 Pro, Flash, and more', helpText: 'Get a free key from Google AI Studio.', icon: Brain, category: 'ai-providers', status: 'available', setupLabel: 'Add API key' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Access many models with one key', helpText: 'Hundreds of models, one key.', icon: Cloud, category: 'ai-providers', status: 'available', setupLabel: 'Add API key', tags: ['recommended'] },
  { id: 'ollama', name: 'Ollama (Local)', description: 'Run open-source models on your machine', helpText: 'Fully private, no API key needed.', icon: Zap, category: 'ai-providers', status: 'available', setupLabel: 'Detect', tags: ['local', 'free'] },
  { id: 'web-browse', name: 'Web Browsing', description: 'Let agents search and read web pages', helpText: 'Agents can look things up online.', icon: Globe, category: 'data', status: 'available', setupLabel: 'Enable' },
  { id: 'file-upload', name: 'File Upload', description: 'Give agents access to your uploaded files', helpText: 'Upload documents for agents to reference.', icon: FileText, category: 'data', status: 'available', setupLabel: 'Enable' },
  { id: 'github', name: 'GitHub', description: 'Read repos, create issues, open PRs', helpText: 'Connect your GitHub account.', icon: GitBranch, category: 'dev-tools', status: 'coming-soon', setupLabel: 'Connect' },
];

const PLUGIN_CATEGORIES: { id: PluginCategory; label: string; icon: React.ElementType }[] = [
  { id: 'ai-providers', label: 'AI Providers', icon: Brain },
  { id: 'productivity', label: 'Productivity', icon: Calendar },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'data', label: 'Data & Web', icon: Globe },
  { id: 'dev-tools', label: 'Dev Tools', icon: GitBranch },
];

const PluginsSection: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all');

  const filtered = PLUGINS.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
    }
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    return true;
  });

  const handleConnect = (plugin: PluginDef) => {
    toast.success(`${plugin.name} setup started`, { description: plugin.helpText });
  };

  return (
    <section>
      <h2 className="font-display font-semibold text-lg text-foreground mb-1 flex items-center gap-2">
        <Plug className="w-4 h-4" /> Plugins & Connections
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Invite tools and services into your office. Each plugin gives your agents new abilities.
      </p>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search plugins..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setSelectedCategory('all')} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>All</button>
          {PLUGIN_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>{cat.label}</button>
          ))}
        </div>
      </div>

      {/* Plugin list */}
      <div className="space-y-3">
        {PLUGIN_CATEGORIES.filter(cat => selectedCategory === 'all' || selectedCategory === cat.id).map(cat => {
          const catPlugins = filtered.filter(p => p.category === cat.id);
          if (catPlugins.length === 0) return null;
          return (
            <div key={cat.id}>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <cat.icon className="w-3.5 h-3.5" /> {cat.label}
              </p>
              <div className="space-y-1.5">
                {catPlugins.map(plugin => (
                  <div key={plugin.id} className={`flex items-center gap-3 p-3 bg-muted rounded-lg transition-all ${plugin.status === 'coming-soon' ? 'opacity-50' : 'hover:bg-accent/50'}`}>
                    <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center shrink-0">
                      <plugin.icon className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">{plugin.name}</span>
                        {plugin.tags?.includes('popular') && <Badge variant="secondary" className="text-[9px] px-1 py-0">Popular</Badge>}
                        {plugin.tags?.includes('recommended') && <Badge className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20">Recommended</Badge>}
                        {plugin.tags?.includes('free') && <Badge variant="outline" className="text-[9px] px-1 py-0">Free</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{plugin.description}</p>
                    </div>
                    <div className="shrink-0">
                      {plugin.status === 'connected' ? (
                        <span className="text-[11px] text-primary flex items-center gap-1"><Check className="w-3 h-3" /> Connected</span>
                      ) : plugin.status === 'coming-soon' ? (
                        <Badge variant="outline" className="text-[9px]">Soon</Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleConnect(plugin)}>
                          {plugin.setupLabel} <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-6">
            <Search className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">No plugins match your search</p>
            <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => { setSearch(''); setSelectedCategory('all'); }}>Clear filters</Button>
          </div>
        )}
      </div>
    </section>
  );
};


  const navigate = useNavigate();
  const modelConfig = useModelConfig();
  const store = useModelStore();
  const [showModelWizard, setShowModelWizard] = useState(false);
  const currentSetup = SETUP_OPTIONS.find(o => o.id === modelConfig.setupPath);
  const currentPreset = SMART_PRESETS.find(p => p.id === modelConfig.smartPreset);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage how your agents work, connect, and behave</p>
      </div>

      <div className="space-y-8">
        {/* How agents run */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-1 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> How Agents Run
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Controls where and how your agents execute their tasks — on your computer or in the cloud.</p>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-sm font-medium">Connection Status</Label>
                    <HelpTip text="This shows whether Homeroom is connected to a real AI backend. In Demo Mode, agents simulate work so you can explore the interface safely without using any credits or API calls." />
                  </div>
                  <p className="text-xs text-muted-foreground">Shows whether agents are running real tasks or just previewing in demo mode</p>
                </div>
                <span className="px-3 py-1 bg-status-waiting/15 text-status-waiting text-xs font-medium rounded-full">Demo Mode</span>
              </div>
            </div>

            <SettingRow
              label="Always-on mode"
              description="When enabled, agents keep working in the background even after you close the browser tab."
              detail="Without this, agents only run while you have Homeroom open. Turning this on means they'll continue finishing tasks, checking schedules, and responding — even while you're away."
            >
              <Switch />
            </SettingRow>

            <div className="flex items-start justify-between gap-4 py-1">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Where agents run</Label>
                  <HelpTip text="Local means agents run on your own machine — faster and more private, but requires your computer to be on. Cloud means they run on remote servers — always available, but tasks travel over the internet." />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">Choose whether agents do their work on your computer (Local) or on remote servers (Cloud)</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" className="text-xs h-8"><Cpu className="w-3 h-3" /> Local</Button>
                <Button size="sm" variant="ghost" className="text-xs h-8"><Cloud className="w-3 h-3" /> Cloud</Button>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Model Setup */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-1 flex items-center gap-2">
            <Brain className="w-4 h-4" /> Model Setup
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Choose which AI brain powers your agents. Different models vary in speed, cost, and capability.</p>
          {showModelWizard ? (
            <div className="mb-4">
              <ModelSetupWizard onComplete={() => setShowModelWizard(false)} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground">{currentSetup?.name ?? 'Not configured'}</p>
                      <HelpTip text="This is the AI provider and model your agents currently use to think and respond. If not set up, agents can't do real work yet." />
                    </div>
                    <p className="text-xs text-muted-foreground">Smartness: {currentPreset?.name ?? 'Balanced'} — controls how carefully agents think vs. how fast they respond</p>
                  </div>
                  <Badge variant={modelConfig.apiKey ? 'default' : 'secondary'} className="text-[10px]">
                    {modelConfig.apiKey ? 'Connected' : 'Not set up'}
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowModelWizard(true)}>
                {modelConfig.apiKey ? 'Reconfigure Models' : 'Set Up Models'}
              </Button>
            </div>
          )}
        </section>

        <Separator />

        {/* API Keys */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-1 flex items-center gap-2">
            <Key className="w-4 h-4" /> API Keys
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            API keys are like passwords that let Homeroom talk to AI providers (like OpenAI or Anthropic) on your behalf. They&apos;re stored only on your device — never sent to our servers.
          </p>
          <Button size="sm" variant="outline" className="mb-4" onClick={() => navigate('/setup')}>
            <Wand2 className="w-3.5 h-3.5" /> Guided Setup Wizard
          </Button>
          <div className="space-y-2">
            {Object.entries(PROVIDER_INFO).map(([key, info]) => (
              <ProviderKeyRow key={key} providerKey={key} info={info} />
            ))}
          </div>
        </section>

        <Separator />

        {/* Safety */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Safety Defaults
          </h2>
          <p className="text-xs text-muted-foreground mb-4">These settings control how cautious new agents are by default. You can always change them per agent later.</p>
          <div className="space-y-4">
            <SettingRow
              label="Require approval by default"
              description="New agents will pause and ask for your OK before taking any action — like sending a message or making a change."
              detail="This is the safest option. With approval required, an agent will show you what it plans to do and wait for you to confirm. Great for building trust with a new agent before letting it work independently."
            >
              <Switch defaultChecked />
            </SettingRow>

            <SettingRow
              label="Background execution off by default"
              description="New agents will only start working when you explicitly tell them to — they won't run on their own."
              detail="When this is on, agents sit idle until you press 'Run Now' or send them a task. This prevents surprise activity. Turn it off if you want agents to follow their schedules automatically."
            >
              <Switch defaultChecked />
            </SettingRow>
          </div>
        </section>

        <Separator />

        {/* Office */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-1">Office</h2>
          <p className="text-xs text-muted-foreground mb-4">Visual preferences for the Office view — the virtual workspace where your agents hang out.</p>
          <div className="space-y-4">
            <SettingRow
              label="Ambient animations"
              description="Small background details like plants swaying and monitors glowing, making the office feel alive."
              detail="These are purely decorative. They don't affect performance or how agents work — just add a cozy atmosphere. Turn off if you prefer a cleaner, more static look."
            >
              <Switch defaultChecked />
            </SettingRow>

            <SettingRow
              label="Agent idle animations"
              description="Agents subtly move or shift when they're not actively working — like a person fidgeting at their desk."
              detail="This makes agents feel more lifelike. They'll do small idle motions when they have nothing to do. Turning this off makes them stand perfectly still, which can feel cleaner but less charming."
            >
              <Switch defaultChecked />
            </SettingRow>
          </div>
        </section>

        <Separator />

        {/* Notifications */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-1">Notifications</h2>
          <p className="text-xs text-muted-foreground mb-4">Choose which events you want to be notified about. These show up as alerts inside Homeroom.</p>
          <div className="space-y-4">
            <SettingRow
              label="Agent needs attention"
              description="Get notified when an agent is stuck, has a question, or needs your approval to continue."
              detail="This is important if you have approval mode turned on — without this notification, you might not notice an agent waiting for your input, causing delays."
            >
              <Switch defaultChecked />
            </SettingRow>

            <SettingRow
              label="Task completed"
              description="Get notified when an agent finishes a task you gave it — so you can review the result."
              detail="Useful for keeping track of what's been done, especially if agents are running in the background. You'll see a quick summary of what was completed."
            >
              <Switch defaultChecked />
            </SettingRow>
          </div>
        </section>

        <Separator />

        {/* Account */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-1">Account</h2>
          <p className="text-xs text-muted-foreground mb-4">Your personal details. This is how agents and the system refer to you.</p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label className="text-sm font-medium">Display Name</Label>
                <HelpTip text="This is the name agents will use when talking to you or about you. It doesn't affect any login or security — it's just a friendly label." />
              </div>
              <Input className="mt-1" defaultValue="Manager" />
            </div>
          </div>
          <Button className="mt-4" size="sm">Save Changes</Button>
        </section>

        <Separator />

        {/* Plugins & Connections */}
        <PluginsSection />

        <Separator />

        {/* Debug */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-1 text-muted-foreground">Debug</h2>
          <p className="text-xs text-muted-foreground mb-3">Developer tools for testing. You probably don&apos;t need these unless something went wrong.</p>
          <Button size="sm" variant="outline" onClick={() => { localStorage.removeItem('homeroom-onboarded'); window.location.href = '/onboarding'; }}>
            <RefreshCw className="w-3 h-3" /> Reset Onboarding
          </Button>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
