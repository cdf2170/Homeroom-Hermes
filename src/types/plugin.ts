export type PluginSafetyLabel = 'Safe' | 'Review recommended' | 'Advanced';
export type PluginType = 'local' | 'cloud' | 'local-or-cloud';
export type PluginSetupMethod = 'api-key' | 'oauth' | 'local-connection' | 'bot-token' | 'built-in' | 'oauth-or-token';
export type PluginCategory =
  | 'Models / AI Providers'
  | 'Productivity'
  | 'Communication'
  | 'Developer Tools'
  | 'Files & Storage'
  | 'Home / Automation'
  | 'Research'
  | 'Core System';

export interface Plugin {
  id: string;
  name: string;
  category: PluginCategory;
  description: string;
  agentCapabilities: string;
  accessDescription: string;
  type: PluginType;
  safetyLabel: PluginSafetyLabel;
  setupMethod: PluginSetupMethod;
  docsUrl: string;
  setupGuideLabel: string;
  onboardingMicrocopy: string;
  icon: string; // lucide icon name
}

export interface PluginConnection {
  pluginId: string;
  status: 'connected' | 'disconnected';
  connectedAt?: string;
  config?: Record<string, string>;
}
