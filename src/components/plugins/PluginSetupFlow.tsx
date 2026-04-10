import React, { useState } from 'react';
import { Plugin } from '@/types/plugin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Eye, EyeOff, Check, Lock, FolderOpen, Plug } from 'lucide-react';

interface PluginSetupFlowProps {
  plugin: Plugin;
  onConnect: () => void;
}

const PluginSetupFlow: React.FC<PluginSetupFlowProps> = ({ plugin, onConnect }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      onConnect();
    }, 1500);
  };

  if (connected) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-status-working/10 text-status-working text-sm font-medium">
        <Check className="w-4 h-4" />
        Connected successfully
      </div>
    );
  }

  if (plugin.setupMethod === 'api-key') {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">API Key</label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder={`Paste your ${plugin.name} API key`}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <a
          href={plugin.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Where do I find this? <ExternalLink className="w-3 h-3" />
        </a>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" />
          Stored locally on your device
        </div>
        <Button onClick={handleConnect} disabled={!apiKey.trim() || connecting} className="w-full">
          {connecting ? 'Connecting…' : 'Save & Connect'}
        </Button>
      </div>
    );
  }

  if (plugin.setupMethod === 'oauth') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          You'll sign in with your {plugin.name.replace('Google ', 'Google ')} account. Homeroom only gets the access you approve.
        </p>
        <Button onClick={handleConnect} disabled={connecting} className="w-full">
          {connecting ? 'Connecting…' : `Sign in with ${plugin.name.includes('Google') || plugin.name.includes('Gmail') ? 'Google' : plugin.name}`}
        </Button>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" />
          You control what access to give
        </div>
      </div>
    );
  }

  if (plugin.setupMethod === 'oauth-or-token') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          You can sign in with your account or paste a personal access token.
        </p>
        <Button onClick={handleConnect} disabled={connecting} variant="default" className="w-full">
          {connecting ? 'Connecting…' : `Sign in with ${plugin.name}`}
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-[10px] uppercase text-muted-foreground"><span className="bg-background px-2">or</span></div>
        </div>
        <Input
          type={showKey ? 'text' : 'password'}
          placeholder="Paste access token"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
        {apiKey.trim() && (
          <Button onClick={handleConnect} disabled={connecting} variant="secondary" className="w-full">
            {connecting ? 'Connecting…' : 'Connect with token'}
          </Button>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" />
          Stored locally on your device
        </div>
      </div>
    );
  }

  if (plugin.setupMethod === 'bot-token') {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Bot Token</label>
          <Input
            type={showKey ? 'text' : 'password'}
            placeholder={`Paste your ${plugin.name} bot token`}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </div>
        <a
          href={plugin.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          How to create a bot <ExternalLink className="w-3 h-3" />
        </a>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" />
          Stored locally on your device
        </div>
        <Button onClick={handleConnect} disabled={!apiKey.trim() || connecting} className="w-full">
          {connecting ? 'Connecting…' : 'Save & Connect'}
        </Button>
      </div>
    );
  }

  if (plugin.setupMethod === 'local-connection') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {plugin.id === 'local-files'
            ? 'Choose which folders on your device agents can access. Nothing is uploaded.'
            : 'Connects to software already running on your machine.'}
        </p>
        <Button onClick={handleConnect} disabled={connecting} className="w-full">
          {plugin.id === 'local-files' ? <FolderOpen className="w-4 h-4 mr-1.5" /> : <Plug className="w-4 h-4 mr-1.5" />}
          {connecting ? 'Connecting…' : plugin.setupGuideLabel}
        </Button>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" />
          Your data stays on your machine
        </div>
      </div>
    );
  }

  // built-in
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-status-working/10 text-status-working text-sm font-medium">
        <Check className="w-4 h-4" />
        Already enabled — no setup needed
      </div>
      <p className="text-xs text-muted-foreground">
        This works out of the box. Agents can use this capability whenever they need it.
      </p>
    </div>
  );
};

export default PluginSetupFlow;
