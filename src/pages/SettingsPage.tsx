import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Shield, Cpu, Cloud, Key, Eye, EyeOff, Trash2, Check, ExternalLink, Info, Plus, Loader2, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useModelConfig, hasProviderKey, setProviderKey, removeProviderKey } from '@/store/modelConfigStore';
import { PROVIDER_INFO } from '@/data/models';
import { toast } from 'sonner';
import { useConnectionStatus } from '@/lib/connection';
import { useSettings, useUpdateSettings, useCredentials, useSaveCredential, useDeleteCredential } from '@/hooks/api/useAgents';
import { useUiPrefs, setUiPref } from '@/store/uiPrefsStore';

// ── Provider Card ──────────────────────────────────────────────────────────────

const ProviderCard: React.FC<{ providerId: string; info: typeof PROVIDER_INFO[string]; maskedKey?: string | null }> = ({
  providerId, info, maskedKey,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const saveCred = useSaveCredential();
  const deleteCred = useDeleteCredential();

  // Also check localStorage as a fallback
  const localConnected = hasProviderKey(providerId);
  const connected = !!maskedKey || localConnected;

  const handleOpenPortal = () => {
    window.open(info.keyUrl, `${providerId}-portal`, 'width=1100,height=720,menubar=no,toolbar=no,location=yes,status=no');
  };

  const handleSave = async () => {
    const key = value.trim();
    if (!key) return;

    // Save to localStorage immediately for instant UI feedback
    setProviderKey(providerId, key);

    // Persist to backend
    try {
      await saveCred.mutateAsync({ provider: providerId, key });
      toast.success(`${info.name} connected`);
      setExpanded(false);
      setValue('');
    } catch {
      // toast already shown by mutation onError — local key still saved
    }
  };

  const handleDisconnect = async () => {
    removeProviderKey(providerId);
    try {
      await deleteCred.mutateAsync(providerId);
      toast.success(`${info.name} disconnected`);
    } catch {
      // silent — local key already removed
    }
  };

  return (
    <div className={`rounded-xl border transition-all ${connected ? 'border-border bg-card' : 'border-dashed border-border bg-muted/30'}`}>
      <div className="flex items-center gap-3 p-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${connected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {info.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{info.name}</p>
            {connected && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-status-working/10 text-status-working">Connected</span>
            )}
          </div>
          {connected && maskedKey && (
            <p className="text-[10px] text-muted-foreground font-mono">{maskedKey}</p>
          )}
          {!connected && (
            <p className="text-[10px] text-muted-foreground">{info.helpText}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {connected ? (
            <>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setExpanded(v => !v)}>
                {expanded ? 'Cancel' : 'Update key'}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={handleDisconnect} disabled={deleteCred.isPending}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setExpanded(v => !v)}>
              <Plus className="w-3 h-3" /> Connect
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={handleOpenPortal}
            >
              <ExternalLink className="w-3 h-3" />
              Open {info.name} portal
            </Button>
            <span className="text-[10px] text-muted-foreground">Get your API key, then paste it below</span>
          </div>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder={info.keyPlaceholder || 'Paste your API key here'}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && value.trim()) handleSave(); }}
              className="h-9 text-xs font-mono pr-8"
              autoFocus
            />
            <button
              onClick={() => setShowKey(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleSave}
              disabled={!value.trim() || saveCred.isPending}
            >
              {saveCred.isPending
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                : <><Check className="w-3 h-3" /> Save &amp; connect</>
              }
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
// ── Providers section ──────────────────────────────────────────────────────────

const ProvidersSection: React.FC = () => {
  const { data: credentials = [], isLoading } = useCredentials();

  // Build a map of providerId → maskedKey from backend data
  const credMap = new Map(credentials.map(c => [c.provider, c.masked]));

  if (isLoading) {
    return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(PROVIDER_INFO).map(([key, info]) => (
        <ProviderCard
          key={key}
          providerId={key}
          info={info}
          maskedKey={credMap.get(key) ?? null}
        />
      ))}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const connectionStatus = useConnectionStatus();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const prefs = useUiPrefs();

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
                    <HelpTip text="Shows whether Homeroom can reach the local backend service at localhost:5174. When disconnected, agent runs and settings changes will not persist." />
                  </div>
                  <p className="text-xs text-muted-foreground">Backend service connection status</p>
                </div>
                {connectionStatus === 'connected' ? (
                  <span className="px-3 py-1 bg-status-working/15 text-status-working text-xs font-medium rounded-full">Connected</span>
                ) : connectionStatus === 'checking' ? (
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">Checking...</span>
                ) : (
                  <span className="px-3 py-1 bg-destructive/15 text-destructive text-xs font-medium rounded-full">Disconnected</span>
                )}
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

        {/* Providers */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-1 flex items-center gap-2">
            <Key className="w-4 h-4" /> Providers
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Connect the AI providers your agents can use. Keys are encrypted and stored locally — never sent to Homeroom servers. Only providers you connect here will be available when configuring agents.
          </p>
          <ProvidersSection />
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
              <Switch
                checked={prefs.requireApprovalByDefault}
                onCheckedChange={v => setUiPref('requireApprovalByDefault', v)}
              />
            </SettingRow>

            <SettingRow
              label="Background execution off by default"
              description="New agents will only start working when you explicitly tell them to — they won't run on their own."
              detail="When this is on, agents sit idle until you press 'Run Now' or send them a task. This prevents surprise activity. Turn it off if you want agents to follow their schedules automatically."
            >
              <Switch
                checked={prefs.backgroundOffByDefault}
                onCheckedChange={v => setUiPref('backgroundOffByDefault', v)}
              />
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
              <Switch
                checked={prefs.ambientAnimations}
                onCheckedChange={v => setUiPref('ambientAnimations', v)}
              />
            </SettingRow>

            <SettingRow
              label="Agent idle animations"
              description="Agents subtly move or shift when they're not actively working — like a person fidgeting at their desk."
              detail="This makes agents feel more lifelike. They'll do small idle motions when they have nothing to do. Turning this off makes them stand perfectly still, which can feel cleaner but less charming."
            >
              <Switch
                checked={prefs.agentIdleAnimations}
                onCheckedChange={v => setUiPref('agentIdleAnimations', v)}
              />
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
              <Switch
                checked={prefs.notifyOnAttention}
                onCheckedChange={v => setUiPref('notifyOnAttention', v)}
              />
            </SettingRow>

            <SettingRow
              label="Task completed"
              description="Get notified when an agent finishes a task you gave it — so you can review the result."
              detail="Useful for keeping track of what's been done, especially if agents are running in the background. You'll see a quick summary of what was completed."
            >
              <Switch
                checked={prefs.notifyOnComplete}
                onCheckedChange={v => setUiPref('notifyOnComplete', v)}
              />
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
