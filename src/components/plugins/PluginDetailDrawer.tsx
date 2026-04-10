import React, { useState } from 'react';
import { Plugin, PluginConnection } from '@/types/plugin';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Shield, Zap, Eye, Wifi, WifiOff, Monitor, Cloud } from 'lucide-react';
import { icons } from 'lucide-react';
import PluginSetupFlow from './PluginSetupFlow';

interface PluginDetailDrawerProps {
  plugin: Plugin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: PluginConnection;
  onConnect: (pluginId: string) => void;
  onDisconnect: (pluginId: string) => void;
}

const safetyStyles: Record<string, string> = {
  'Safe': 'bg-status-working/15 text-status-working border-status-working/20',
  'Review recommended': 'bg-status-waiting/15 text-status-waiting border-status-waiting/20',
  'Advanced': 'bg-destructive/15 text-destructive border-destructive/20',
};

const typeLabel: Record<string, { text: string; icon: React.ElementType }> = {
  local: { text: 'Local — runs on your machine, fully private', icon: Monitor },
  cloud: { text: 'Cloud — sends data to an online service', icon: Cloud },
  'local-or-cloud': { text: 'Local or Cloud — depends on your setup', icon: Wifi },
};

function getSetupExplainer(plugin: Plugin): string {
  switch (plugin.setupMethod) {
    case 'api-key': return `You'll paste a key from ${plugin.name}. It's stored locally on your device.`;
    case 'oauth': return `You'll sign in with your ${plugin.name.includes('Google') || plugin.name.includes('Gmail') ? 'Google' : plugin.name} account. Homeroom only gets the access you approve.`;
    case 'local-connection': return 'Connects to software already running on your machine.';
    case 'bot-token': return `You'll create a bot in ${plugin.name} and paste its token here.`;
    case 'built-in': return 'This works out of the box — no setup needed.';
    case 'oauth-or-token': return `Sign in with ${plugin.name} or paste an access token.`;
    default: return '';
  }
}

const PluginDetailDrawer: React.FC<PluginDetailDrawerProps> = ({
  plugin, open, onOpenChange, connection, onConnect, onDisconnect
}) => {
  const [showSetup, setShowSetup] = useState(false);

  if (!plugin) return null;

  const isConnected = connection?.status === 'connected';
  const IconComponent = (icons as Record<string, React.ElementType>)[
    plugin.icon.replace(/-./g, x => x[1].toUpperCase())
  ] || Shield;
  const TypeIcon = typeLabel[plugin.type]?.icon || Cloud;

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setShowSetup(false); }}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader className="pb-0">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <IconComponent className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-display">{plugin.name}</SheetTitle>
              <p className="text-xs text-muted-foreground">{plugin.category}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 mt-5">
          {/* Safety + Type badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`text-[11px] ${safetyStyles[plugin.safetyLabel]}`}>
              <Shield className="w-3 h-3 mr-1" />
              {plugin.safetyLabel}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              <TypeIcon className="w-3 h-3 mr-1" />
              {plugin.type === 'local' ? 'Local' : plugin.type === 'cloud' ? 'Cloud' : 'Local or Cloud'}
            </Badge>
            {isConnected && (
              <Badge variant="outline" className="text-[11px] bg-status-working/15 text-status-working border-status-working/20">
                Connected
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-foreground leading-relaxed">{plugin.description}</p>

          {/* Capabilities card */}
          <div className="p-3.5 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              What agents can do with this
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{plugin.agentCapabilities}</p>
          </div>

          {/* Access card */}
          <div className="p-3.5 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5">
              <Eye className="w-3.5 h-3.5 text-status-waiting" />
              What access this gives
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{plugin.accessDescription}</p>
          </div>

          {/* Type explainer */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <TypeIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{typeLabel[plugin.type]?.text}</p>
          </div>

          {/* Setup method explainer */}
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">How to connect: </span>
            {getSetupExplainer(plugin)}
          </div>

          {/* Onboarding microcopy */}
          <p className="text-xs text-muted-foreground leading-relaxed italic">{plugin.onboardingMicrocopy}</p>

          {/* Docs link */}
          <a
            href={plugin.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Official docs
          </a>

          {/* Setup / Connect / Disconnect */}
          {isConnected ? (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-status-working font-medium">
                <div className="w-2 h-2 rounded-full bg-status-working" />
                Connected
                {connection?.connectedAt && (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    since {new Date(connection.connectedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDisconnect(plugin.id)}
              >
                Disconnect
              </Button>
            </div>
          ) : showSetup ? (
            <div className="pt-2 border-t border-border">
              <PluginSetupFlow plugin={plugin} onConnect={() => onConnect(plugin.id)} />
            </div>
          ) : (
            <Button onClick={() => setShowSetup(true)} className="w-full">
              {plugin.setupGuideLabel}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PluginDetailDrawer;
