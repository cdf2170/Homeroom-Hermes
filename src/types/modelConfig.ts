// === Model Setup Types ===

export type SetupPath = 'recommended' | 'premium' | 'local' | 'unsure';

export type SmartPreset = 'fast' | 'balanced' | 'best' | 'private';

export type ModelProvider = 'openrouter' | 'openai' | 'anthropic' | 'ollama' | 'custom';

export interface SetupOption {
  id: SetupPath;
  name: string;
  summary: string;
  bestFor: string;
  pros: string[];
  tradeoffs: string[];
  whatYouNeed: string;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  costFeeling: string;
  icon: string;
}

export interface SmartPresetOption {
  id: SmartPreset;
  name: string;
  feelsLike: string;
  whenToChoose: string;
  tradeoff: string;
  goodFor: string[];
  icon: string;
}

export interface ModelConfig {
  setupPath: SetupPath;
  smartPreset: SmartPreset;
  provider: ModelProvider;
  apiKey: string;
  preferredModel: string;
  fallbackModel: string;
  routingMode: 'cloud' | 'local' | 'hybrid';
  maxMonthlyBudget: number | null;
  maxTokensPerRequest: number | null;
}

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  setupPath: 'recommended',
  smartPreset: 'balanced',
  provider: 'openrouter',
  apiKey: '',
  preferredModel: '',
  fallbackModel: '',
  routingMode: 'cloud',
  maxMonthlyBudget: null,
  maxTokensPerRequest: null,
};

export const SETUP_OPTIONS: SetupOption[] = [
  {
    id: 'recommended',
    name: 'Recommended Cloud Setup',
    summary: 'The easiest way to get started — works great for most people',
    bestFor: 'Best for beginners and most use cases',
    pros: [
      'One API key and you\'re done',
      'Access to many models through one service',
      'Good balance of quality and cost',
      'Easy to switch models later',
    ],
    tradeoffs: [
      'Requires an OpenRouter account',
      'Your data goes through a cloud service',
    ],
    whatYouNeed: 'An OpenRouter API key (free to sign up, pay as you go)',
    difficulty: 'Easy',
    costFeeling: 'Pay as you go — most people spend $5–20/month',
    icon: 'star',
  },
  {
    id: 'premium',
    name: 'Premium Cloud Setup',
    summary: 'Direct access to the best models from top providers',
    bestFor: 'Best for power users who want top-tier quality',
    pros: [
      'Access to the latest, most capable models',
      'Direct connection — no middleman',
      'Full control over provider settings',
    ],
    tradeoffs: [
      'May cost more than the recommended option',
      'Need to manage API keys per provider',
      'Slightly more setup involved',
    ],
    whatYouNeed: 'An API key from OpenAI, Anthropic, or another provider',
    difficulty: 'Moderate',
    costFeeling: 'Pay as you go — typically $10–50/month depending on usage',
    icon: 'gem',
  },
  {
    id: 'local',
    name: 'Local-First Setup',
    summary: 'Run models on your own computer — fully private',
    bestFor: 'Best for privacy-focused or cost-conscious users',
    pros: [
      'Your data never leaves your computer',
      'Free after initial setup',
      'Works offline',
    ],
    tradeoffs: [
      'Requires a capable computer (8GB+ RAM recommended)',
      'Models may be less capable than cloud options',
      'More technical setup required',
    ],
    whatYouNeed: 'Ollama installed on your computer (free, open source)',
    difficulty: 'Advanced',
    costFeeling: 'Free after setup — runs on your hardware',
    icon: 'lock',
  },
  {
    id: 'unsure',
    name: 'I\'m Not Sure Yet',
    summary: 'We\'ll pick safe defaults — you can change everything later',
    bestFor: 'Best for exploring before committing',
    pros: [
      'No decisions needed right now',
      'Safe, sensible defaults',
      'Guided setup when you\'re ready',
    ],
    tradeoffs: [
      'Agents won\'t run real tasks until you configure a model',
      'You\'ll need to come back to this step later',
    ],
    whatYouNeed: 'Nothing — just pick this and explore the app',
    difficulty: 'Easy',
    costFeeling: 'Free — no accounts or keys needed to explore',
    icon: 'help',
  },
];

export const SMART_PRESETS: SmartPresetOption[] = [
  {
    id: 'fast',
    name: 'Fast & Affordable',
    feelsLike: 'Quick answers, lower cost — like a speedy assistant',
    whenToChoose: 'When you need many quick tasks done without running up costs',
    tradeoff: 'Less detailed on complex reasoning tasks',
    goodFor: ['Simple chat', 'Background agents', 'High-volume tasks'],
    icon: 'bolt',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    feelsLike: 'Good quality at a reasonable price — the sweet spot',
    whenToChoose: 'When you want reliable results for everyday work',
    tradeoff: 'Slightly slower than the fastest option',
    goodFor: ['Most tasks', 'Research', 'Writing', 'Planning'],
    icon: 'scale',
  },
  {
    id: 'best',
    name: 'Best Quality',
    feelsLike: 'The smartest responses possible — like a senior expert',
    whenToChoose: 'When accuracy and depth matter more than speed or cost',
    tradeoff: 'Slower and more expensive per task',
    goodFor: ['Complex research', 'Detailed analysis', 'Important decisions'],
    icon: 'brain',
  },
  {
    id: 'private',
    name: 'Private & Local',
    feelsLike: 'Runs on your machine — nothing leaves your computer',
    whenToChoose: 'When privacy is your top priority',
    tradeoff: 'Quality depends on your hardware; may struggle with hard tasks',
    goodFor: ['Sensitive data', 'Offline work', 'Cost-free usage'],
    icon: 'lock',
  },
];
