import React, { useState, useMemo } from 'react';
import { plugins, BEGINNER_SAFE_IDS, getPluginsByCategory } from '@/data/plugins';
import { Plugin, PluginConnection } from '@/types/plugin';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { icons } from 'lucide-react';
import { Plug, Search, Shield, Monitor, Cloud, Wifi, Star } from 'lucide-react';
import PluginDetailDrawer from '@/components/plugins/PluginDetailDrawer';

const FILTERS = ['All', 'Connected', 'Local', 'Cloud'] as const;
type Filter = typeof FILTERS[number];

const safetyBadge: Record<string, string> = {
  'Safe': 'bg-status-working/15 text-status-working border-status-working/20',
  'Review recommended': 'bg-status-waiting/15 text-status-waiting border-status-waiting/20',
  'Advanced': 'bg-destructive/15 text-destructive border-destructive/20',
};

const PluginsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [connections, setConnections] = useState<Record<string, PluginConnection>>({});

  const handleConnect = (pluginId: string) => {
    setConnections(prev => ({
      ...prev,
      [pluginId]: { pluginId, status: 'connected', connectedAt: new Date().toISOString() },
    }));
  };

  const handleDisconnect = (pluginId: string) => {
    setConnections(prev => {
      const next = { ...prev };
      delete next[pluginId];
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = plugins;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (filter === 'Connected') list = list.filter(p => connections[p.id]?.status === 'connected');
    if (filter === 'Local') list = list.filter(p => p.type === 'local' || p.type === 'local-or-cloud');
    if (filter === 'Cloud') list = list.filter(p => p.type === 'cloud' || p.type === 'local-or-cloud');
    return list;
  }, [search, filter, connections]);

  const grouped = getPluginsByCategory(filtered);
  const beginnerPlugins = plugins.filter(p => BEGINNER_SAFE_IDS.includes(p.id));
  const connectedCount = Object.values(connections).filter(c => c.status === 'connected').length;

  return (
    <div className="p-6 max-w-5xl mx-auto pb-16">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Plug className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
          Plugins & Connections
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
          Invite useful tools into your office. Each plugin gives your agents new capabilities — you decide what they can access.
        </p>
      </div>

      {/* Recommended row */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Most people start with…</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {beginnerPlugins.map(plugin => {
            const IconComp = (icons as Record<string, React.ElementType>)[
              plugin.icon.replace(/-./g, x => x[1].toUpperCase())
            ] || Shield;
            const isConnected = connections[plugin.id]?.status === 'connected';
            return (
              <button
                key={plugin.id}
                onClick={() => setSelectedPlugin(plugin)}
                className="group text-left p-4 bg-card border border-primary/20 rounded-xl transition-all hover:border-primary/40 hover:shadow-md relative"
              >
                <Badge className="absolute top-2 right-2 text-[9px] bg-status-working/15 text-status-working border-status-working/20" variant="outline">
                  Recommended
                </Badge>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <IconComp className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-foreground">{plugin.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{plugin.type === 'local' ? 'Local' : 'Cloud'}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{plugin.description}</p>
                {isConnected && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-status-working font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-working" /> Connected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter + search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {f}{f === 'Connected' && connectedCount > 0 ? ` (${connectedCount})` : ''}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Category grids */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">
            {filter === 'Connected'
              ? 'No plugins connected yet — start with one of our recommendations above.'
              : 'No plugins match your search.'}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, catPlugins]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catPlugins.map(plugin => {
                const IconComp = (icons as Record<string, React.ElementType>)[
                  plugin.icon.replace(/-./g, x => x[1].toUpperCase())
                ] || Shield;
                const isConnected = connections[plugin.id]?.status === 'connected';
                return (
                  <button
                    key={plugin.id}
                    onClick={() => setSelectedPlugin(plugin)}
                    className="group text-left p-4 bg-card border border-border rounded-xl transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <IconComp className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-sm text-foreground truncate">{plugin.name}</h3>
                          {isConnected && <div className="w-2 h-2 rounded-full bg-status-working shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{plugin.setupGuideLabel}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2.5">{plugin.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className={`text-[10px] py-0 ${safetyBadge[plugin.safetyLabel]}`}>
                        {plugin.safetyLabel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {plugin.type === 'local' ? (
                          <><Monitor className="w-2.5 h-2.5 mr-0.5" /> Local</>
                        ) : plugin.type === 'cloud' ? (
                          <><Cloud className="w-2.5 h-2.5 mr-0.5" /> Cloud</>
                        ) : (
                          <><Wifi className="w-2.5 h-2.5 mr-0.5" /> Local / Cloud</>
                        )}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Detail drawer */}
      <PluginDetailDrawer
        plugin={selectedPlugin}
        open={!!selectedPlugin}
        onOpenChange={open => { if (!open) setSelectedPlugin(null); }}
        connection={selectedPlugin ? connections[selectedPlugin.id] : undefined}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Footer trust language */}
      <div className="mt-4 p-4 bg-muted/50 rounded-xl text-center max-w-lg mx-auto">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium">You're always in control.</span> API keys are stored locally on your device. Agents only get the access you explicitly approve. You can disconnect any plugin at any time.
        </p>
      </div>
    </div>
  );
};

export default PluginsPage;
