// === Real AI Model Registry ===

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerIcon: string;
  description: string;
  tags: string[]; // e.g. 'fast', 'powerful', 'vision', 'cheap'
  contextWindow: string;
  costTier: 'free' | 'low' | 'mid' | 'high' | 'premium';
}

export const AI_MODELS: AIModel[] = [
  // OpenAI
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerIcon: 'OAI',
    description: 'Fast, multimodal, great all-rounder',
    tags: ['fast', 'vision', 'popular'],
    contextWindow: '128k',
    costTier: 'mid',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    providerIcon: 'OAI',
    description: 'Affordable and quick for simple tasks',
    tags: ['fast', 'cheap'],
    contextWindow: '128k',
    costTier: 'low',
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    providerIcon: 'OAI',
    description: 'Powerful reasoning with large context',
    tags: ['powerful', 'vision'],
    contextWindow: '128k',
    costTier: 'high',
  },
  {
    id: 'openai/o1',
    name: 'o1',
    provider: 'OpenAI',
    providerIcon: 'OAI',
    description: 'Advanced reasoning model for hard problems',
    tags: ['reasoning', 'powerful'],
    contextWindow: '200k',
    costTier: 'premium',
  },
  {
    id: 'openai/o1-mini',
    name: 'o1 Mini',
    provider: 'OpenAI',
    providerIcon: 'OAI',
    description: 'Fast reasoning at lower cost',
    tags: ['reasoning', 'fast'],
    contextWindow: '128k',
    costTier: 'mid',
  },

  // Anthropic
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    providerIcon: 'ANT',
    description: 'Excellent writing and analysis',
    tags: ['powerful', 'popular', 'writing'],
    contextWindow: '200k',
    costTier: 'mid',
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    providerIcon: 'ANT',
    description: 'Most capable Claude for complex tasks',
    tags: ['powerful', 'reasoning'],
    contextWindow: '200k',
    costTier: 'premium',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    providerIcon: 'ANT',
    description: 'Lightning fast and very affordable',
    tags: ['fast', 'cheap'],
    contextWindow: '200k',
    costTier: 'low',
  },
  {
    id: 'anthropic/claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    providerIcon: 'ANT',
    description: 'Latest generation, top-tier quality',
    tags: ['powerful', 'popular', 'reasoning'],
    contextWindow: '200k',
    costTier: 'high',
  },

  // Google
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    providerIcon: 'GGL',
    description: 'Strong reasoning and multimodal',
    tags: ['powerful', 'vision', 'reasoning'],
    contextWindow: '1M',
    costTier: 'mid',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerIcon: 'GGL',
    description: 'Fast and cost-effective',
    tags: ['fast', 'cheap', 'vision'],
    contextWindow: '1M',
    costTier: 'low',
  },
  {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    providerIcon: 'GGL',
    description: 'Quick responses, good for most tasks',
    tags: ['fast'],
    contextWindow: '1M',
    costTier: 'low',
  },

  // xAI
  {
    id: 'xai/grok-2',
    name: 'Grok 2',
    provider: 'xAI',
    providerIcon: 'XAI',
    description: 'Real-time knowledge, witty and capable',
    tags: ['powerful', 'popular'],
    contextWindow: '128k',
    costTier: 'mid',
  },
  {
    id: 'xai/grok-2-mini',
    name: 'Grok 2 Mini',
    provider: 'xAI',
    providerIcon: 'XAI',
    description: 'Lighter Grok for fast tasks',
    tags: ['fast', 'cheap'],
    contextWindow: '128k',
    costTier: 'low',
  },

  // Meta (open source via OpenRouter/Ollama)
  {
    id: 'meta/llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    providerIcon: 'META',
    description: 'Open source, strong performance',
    tags: ['open-source', 'powerful'],
    contextWindow: '128k',
    costTier: 'low',
  },
  {
    id: 'meta/llama-3.1-8b',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    providerIcon: 'META',
    description: 'Lightweight, runs locally too',
    tags: ['open-source', 'fast', 'local'],
    contextWindow: '128k',
    costTier: 'free',
  },

  // Mistral
  {
    id: 'mistral/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    providerIcon: 'MST',
    description: 'Top-tier European AI model',
    tags: ['powerful', 'reasoning'],
    contextWindow: '128k',
    costTier: 'mid',
  },
  {
    id: 'mistral/mixtral-8x7b',
    name: 'Mixtral 8x7B',
    provider: 'Mistral',
    providerIcon: 'MST',
    description: 'Fast mixture-of-experts, open weights',
    tags: ['fast', 'open-source'],
    contextWindow: '32k',
    costTier: 'low',
  },

  // DeepSeek
  {
    id: 'deepseek/deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    providerIcon: 'DSK',
    description: 'Strong coder and reasoner, very affordable',
    tags: ['powerful', 'cheap', 'coding'],
    contextWindow: '128k',
    costTier: 'low',
  },

  // Perplexity
  {
    id: 'perplexity/sonar-pro',
    name: 'Sonar Pro',
    provider: 'Perplexity',
    providerIcon: 'PPX',
    description: 'Search-augmented, always up to date',
    tags: ['search', 'fast'],
    contextWindow: '128k',
    costTier: 'mid',
  },
];

// Cost tier labels
export const COST_LABELS: Record<AIModel['costTier'], string> = {
  free: 'Free',
  low: '$',
  mid: '$$',
  high: '$$$',
  premium: '$$$$',
};

// Provider list for filtering
export const PROVIDERS = [...new Set(AI_MODELS.map(m => m.provider))];

// Provider setup info — what users need to connect each provider
export interface ProviderInfo {
  name: string;
  icon: string;
  keyName: string; // display label for the key
  keyPlaceholder: string;
  signupUrl: string;
  keyUrl: string; // where to get the key
  helpText: string;
  keyPrefix?: string; // expected prefix for validation hint
}

export const PROVIDER_INFO: Record<string, ProviderInfo> = {
  OpenAI: {
    name: 'OpenAI',
    icon: 'OAI',
    keyName: 'OpenAI API Key',
    keyPlaceholder: 'sk-...',
    signupUrl: 'https://platform.openai.com/signup',
    keyUrl: 'https://platform.openai.com/api-keys',
    helpText: 'Sign up at OpenAI, then go to API Keys to create one.',
    keyPrefix: 'sk-',
  },
  Anthropic: {
    name: 'Anthropic',
    icon: 'ANT',
    keyName: 'Anthropic API Key',
    keyPlaceholder: 'sk-ant-...',
    signupUrl: 'https://console.anthropic.com/',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    helpText: 'Create an account at Anthropic Console, then generate an API key.',
    keyPrefix: 'sk-ant-',
  },
  Google: {
    name: 'Google',
    icon: 'GGL',
    keyName: 'Google AI API Key',
    keyPlaceholder: 'AIza...',
    signupUrl: 'https://aistudio.google.com/',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    helpText: 'Go to Google AI Studio and create an API key — it\'s free to start.',
    keyPrefix: 'AIza',
  },
  xAI: {
    name: 'xAI',
    icon: 'XAI',
    keyName: 'xAI API Key',
    keyPlaceholder: 'xai-...',
    signupUrl: 'https://console.x.ai/',
    keyUrl: 'https://console.x.ai/api-keys',
    helpText: 'Sign up at the xAI console to get your Grok API key.',
    keyPrefix: 'xai-',
  },
  Meta: {
    name: 'Meta (via OpenRouter)',
    icon: 'META',
    keyName: 'OpenRouter API Key',
    keyPlaceholder: 'sk-or-...',
    signupUrl: 'https://openrouter.ai/',
    keyUrl: 'https://openrouter.ai/keys',
    helpText: 'Meta models are available through OpenRouter. Create a free account and get an API key.',
    keyPrefix: 'sk-or-',
  },
  Mistral: {
    name: 'Mistral',
    icon: 'MST',
    keyName: 'Mistral API Key',
    keyPlaceholder: '',
    signupUrl: 'https://console.mistral.ai/',
    keyUrl: 'https://console.mistral.ai/api-keys',
    helpText: 'Sign up at Mistral\'s console and generate an API key.',
  },
  DeepSeek: {
    name: 'DeepSeek',
    icon: 'DSK',
    keyName: 'DeepSeek API Key',
    keyPlaceholder: 'sk-...',
    signupUrl: 'https://platform.deepseek.com/',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    helpText: 'Create an account at DeepSeek and generate an API key.',
    keyPrefix: 'sk-',
  },
  Perplexity: {
    name: 'Perplexity',
    icon: 'PPX',
    keyName: 'Perplexity API Key',
    keyPlaceholder: 'pplx-...',
    signupUrl: 'https://www.perplexity.ai/',
    keyUrl: 'https://www.perplexity.ai/settings/api',
    helpText: 'Go to Perplexity settings to generate an API key.',
    keyPrefix: 'pplx-',
  },
  OpenRouter: {
    name: 'OpenRouter',
    icon: 'OR',
    keyName: 'OpenRouter API Key',
    keyPlaceholder: 'sk-or-...',
    signupUrl: 'https://openrouter.ai/',
    keyUrl: 'https://openrouter.ai/keys',
    helpText: 'OpenRouter gives you access to many models with one key. Free to sign up.',
    keyPrefix: 'sk-or-',
  },
};
