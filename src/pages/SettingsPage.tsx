import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Shield, Cpu, Cloud, RefreshCw, Brain, Key, Eye, EyeOff, Trash2, Check, ExternalLink, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
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

const SettingsPage: React.FC = () => {
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
        <p className="text-sm text-muted-foreground">Manage your office and preferences</p>
      </div>

      <div className="space-y-8">
        {/* How agents run */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> How Agents Run
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Connection Status</Label>
                  <p className="text-xs text-muted-foreground">Whether your agents can do real work</p>
                </div>
                <span className="px-3 py-1 bg-status-waiting/15 text-status-waiting text-xs font-medium rounded-full">Demo Mode</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Always-on mode</Label>
                <p className="text-xs text-muted-foreground">Agents work even when Homeroom is closed</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Where agents run</Label>
                <p className="text-xs text-muted-foreground">Choose where new agents do their work</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="text-xs h-8"><Cpu className="w-3 h-3" /> Local</Button>
                <Button size="sm" variant="ghost" className="text-xs h-8"><Cloud className="w-3 h-3" /> Cloud</Button>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Model Setup */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4" /> Model Setup
          </h2>
          {showModelWizard ? (
            <div className="mb-4">
              <ModelSetupWizard onComplete={() => setShowModelWizard(false)} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{currentSetup?.name ?? 'Not configured'}</p>
                    <p className="text-xs text-muted-foreground">Smartness: {currentPreset?.name ?? 'Balanced'}</p>
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
          <h2 className="font-display font-semibold text-lg text-foreground mb-2 flex items-center gap-2">
            <Key className="w-4 h-4" /> API Keys
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Manage API keys for each provider. Keys are stored locally on your device.
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

        {/* Safety */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Safety Defaults
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Require approval by default</Label>
                <p className="text-xs text-muted-foreground">New agents need approval before acting</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Background execution off by default</Label>
                <p className="text-xs text-muted-foreground">New agents won't run unless you ask</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </section>

        <Separator />

        {/* Office */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-4">Office</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Ambient animations</Label>
                <p className="text-xs text-muted-foreground">Plants sway, monitors glow</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Agent idle animations</Label>
                <p className="text-xs text-muted-foreground">Agents subtly move when idle</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </section>

        <Separator />

        {/* Notifications */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Agent needs attention</Label>
                <p className="text-xs text-muted-foreground">When an agent is waiting for you</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Task completed</Label>
                <p className="text-xs text-muted-foreground">When an agent finishes a task</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </section>

        <Separator />

        {/* Account */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Display Name</Label>
              <Input className="mt-1" defaultValue="Manager" />
            </div>
          </div>
          <Button className="mt-4" size="sm">Save Changes</Button>
        </section>

        <Separator />

        {/* Debug */}
        <section>
          <h2 className="font-display font-semibold text-lg text-foreground mb-4 text-muted-foreground">Debug</h2>
          <Button size="sm" variant="outline" onClick={() => { localStorage.removeItem('homeroom-onboarded'); window.location.href = '/onboarding'; }}>
            <RefreshCw className="w-3 h-3" /> Reset Onboarding
          </Button>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
