import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, Plug, Calendar, Mail, MessageSquare, Globe, Brain,
  Cloud, Key, ExternalLink, Check, ChevronRight, Zap, Shield,
  FileText, Database, Bell, GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';

type PluginStatus = 'available' | 'connected' | 'coming-soon';
type PluginCategory = 'productivity' | 'communication' | 'ai-providers' | 'data' | 'dev-tools';

interface Plugin {
  id: string;
  name: string;
  description: string;
  helpText: string;
  icon: React.ElementType;
  category: PluginCategory;
  status: PluginStatus;
  setupMethod: 'api-key' | 'oauth' | 'webhook' | 'built-in';
  setupLabel: string;
  tags?: string[];
}

const PLUGINS: Plugin[] = [
  // Productivity
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Let agents check your schedule and create events',
    helpText: 'Connect with your Google account — agents can read your calendar and suggest or create events.',
    icon: Calendar,
    category: 'productivity',
    status: 'available',
    setupMethod: 'oauth',
    setupLabel: 'Connect with Google',
    tags: ['popular'],
  },
  {
    id: 'google-docs',
    name: 'Google Docs',
    description: 'Read and write documents through your agents',
    helpText: 'Give agents access to create and edit Google Docs on your behalf.',
    icon: FileText,
    category: 'productivity',
    status: 'coming-soon',
    setupMethod: 'oauth',
    setupLabel: 'Connect with Google',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Search, read, and update your Notion workspace',
    helpText: 'Connect your Notion workspace so agents can find and update pages.',
    icon: Database,
    category: 'productivity',
    status: 'available',
    setupMethod: 'api-key',
    setupLabel: 'Add API key',
    tags: ['popular'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Draft and send emails on your behalf',
    helpText: 'Connect Gmail so agents can draft replies or send messages — always with your approval.',
    icon: Mail,
    category: 'communication',
    status: 'available',
    setupMethod: 'oauth',
    setupLabel: 'Connect with Google',
    tags: ['popular'],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Post messages and read channels',
    helpText: 'Add the Homeroom bot to your Slack workspace. Agents can post updates or read public channels.',
    icon: MessageSquare,
    category: 'communication',
    status: 'available',
    setupMethod: 'oauth',
    setupLabel: 'Add to Slack',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Send messages and monitor server activity',
    helpText: 'Add the Homeroom bot to your Discord server.',
    icon: MessageSquare,
    category: 'communication',
    status: 'coming-soon',
    setupMethod: 'oauth',
    setupLabel: 'Add to Discord',
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Trigger agents from any external service',
    helpText: 'Create webhook URLs that trigger specific agents when called. Great for automation.',
    icon: Bell,
    category: 'communication',
    status: 'available',
    setupMethod: 'built-in',
    setupLabel: 'Create webhook',
  },
  // AI Providers
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, o1, and other OpenAI models',
    helpText: 'Paste your OpenAI API key to unlock GPT models for your agents.',
    icon: Brain,
    category: 'ai-providers',
    status: 'available',
    setupMethod: 'api-key',
    setupLabel: 'Add API key',
    tags: ['popular'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5, Claude 4, and Haiku',
    helpText: 'Add your Anthropic API key to use Claude models.',
    icon: Brain,
    category: 'ai-providers',
    status: 'available',
    setupMethod: 'api-key',
    setupLabel: 'Add API key',
    tags: ['popular'],
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    description: 'Gemini 2.5 Pro, Flash, and more',
    helpText: 'Get a free API key from Google AI Studio to use Gemini models.',
    icon: Brain,
    category: 'ai-providers',
    status: 'available',
    setupMethod: 'api-key',
    setupLabel: 'Add API key',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access many models with one key',
    helpText: 'OpenRouter gives you access to hundreds of models from different providers. Free to sign up.',
    icon: Cloud,
    category: 'ai-providers',
    status: 'available',
    setupMethod: 'api-key',
    setupLabel: 'Add API key',
    tags: ['recommended'],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run open-source models on your machine',
    helpText: 'Install Ollama on your computer to run models locally — fully private, no API key needed.',
    icon: Zap,
    category: 'ai-providers',
    status: 'available',
    setupMethod: 'built-in',
    setupLabel: 'Detect Ollama',
    tags: ['local', 'free'],
  },
  // Data
  {
    id: 'web-browse',
    name: 'Web Browsing',
    description: 'Let agents search and read web pages',
    helpText: 'Agents can look things up online, read articles, and gather information.',
    icon: Globe,
    category: 'data',
    status: 'available',
    setupMethod: 'built-in',
    setupLabel: 'Enable',
  },
  {
    id: 'file-upload',
    name: 'File Upload',
    description: 'Give agents access to your uploaded files',
    helpText: 'Upload documents, images, or data files for agents to reference.',
    icon: FileText,
    category: 'data',
    status: 'available',
    setupMethod: 'built-in',
    setupLabel: 'Enable',
  },
  // Dev Tools
  {
    id: 'github',
    name: 'GitHub',
    description: 'Read repos, create issues, open PRs',
    helpText: 'Connect your GitHub account so agents can work with your repositories.',
    icon: GitBranch,
    category: 'dev-tools',
    status: 'coming-soon',
    setupMethod: 'oauth',
    setupLabel: 'Connect GitHub',
  },
];

const CATEGORIES: { id: PluginCategory; label: string; icon: React.ElementType }[] = [
  { id: 'ai-providers', label: 'AI Providers', icon: Brain },
  { id: 'productivity', label: 'Productivity', icon: Calendar },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'data', label: 'Data & Web', icon: Globe },
  { id: 'dev-tools', label: 'Dev Tools', icon: GitBranch },
];

const PluginsPage: React.FC = () => {
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

  const connected = PLUGINS.filter(p => p.status === 'connected');

  const handleConnect = (plugin: Plugin) => {
    toast.success(`${plugin.name} setup started`, {
      description: plugin.helpText,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
          <Plug className="w-6 h-6 text-primary" />
          Plugins & Connections
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Invite tools and services into your office. Each plugin gives your agents new abilities.
        </p>
      </div>

      {/* Connected summary */}
      {connected.length > 0 && (
        <div className="mb-5 p-3 bg-primary/5 border border-primary/10 rounded-xl">
          <p className="text-xs font-medium text-primary flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {connected.length} plugin{connected.length !== 1 ? 's' : ''} connected
          </p>
        </div>
      )}

      {/* No connections yet */}
      {connected.length === 0 && (
        <div className="mb-5 p-4 bg-muted/50 border border-border rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Key className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No plugins connected yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start with an AI provider to give your agents a brain, then add tools as you need them. 
                Each connection is explained in plain English — no technical setup required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search + Category filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plugin grid */}
      <div className="grid gap-3">
        {CATEGORIES.filter(cat => selectedCategory === 'all' || selectedCategory === cat.id).map(cat => {
          const catPlugins = filtered.filter(p => p.category === cat.id);
          if (catPlugins.length === 0) return null;
          return (
            <div key={cat.id}>
              <h2 className="font-display font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                <cat.icon className="w-4 h-4 text-muted-foreground" />
                {cat.label}
              </h2>
              <div className="grid gap-2 mb-4">
                {catPlugins.map(plugin => (
                  <div
                    key={plugin.id}
                    className={`flex items-center gap-4 p-4 bg-card border border-border rounded-xl transition-all ${
                      plugin.status === 'coming-soon' ? 'opacity-60' : 'hover:shadow-md'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <plugin.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-sm text-foreground">{plugin.name}</h3>
                        {plugin.tags?.includes('popular') && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Popular</Badge>
                        )}
                        {plugin.tags?.includes('recommended') && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">Recommended</Badge>
                        )}
                        {plugin.tags?.includes('free') && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Free</Badge>
                        )}
                        {plugin.tags?.includes('local') && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> Local
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{plugin.description}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{plugin.helpText}</p>
                    </div>
                    <div className="shrink-0">
                      {plugin.status === 'connected' ? (
                        <div className="flex items-center gap-1.5 text-xs text-primary">
                          <Check className="w-4 h-4" />
                          Connected
                        </div>
                      ) : plugin.status === 'coming-soon' ? (
                        <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleConnect(plugin)} className="text-xs">
                          {plugin.setupLabel}
                          <ChevronRight className="w-3 h-3 ml-1" />
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
          <div className="text-center py-12">
            <Search className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground font-medium">No plugins match your search</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSearch(''); setSelectedCategory('all'); }}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-8 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">How plugins work:</span> Each plugin gives agents specific abilities — like reading your calendar or sending emails. 
          You control exactly which agents can use which plugins. API keys are stored securely and never exposed to agents or shown in outputs.
        </p>
      </div>
    </div>
  );
};

export default PluginsPage;
