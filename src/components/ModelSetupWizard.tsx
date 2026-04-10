import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight, ArrowLeft, Check, ChevronDown, ChevronUp, Eye, EyeOff, Info,
  Star, Gem, Lock, HelpCircle, Zap, Scale, Brain,
} from 'lucide-react';
import {
  SETUP_OPTIONS, SMART_PRESETS,
  SetupPath, SmartPreset, ModelConfig, DEFAULT_MODEL_CONFIG,
} from '@/types/modelConfig';
import { updateModelConfig, useModelConfig } from '@/store/modelConfigStore';

interface ModelSetupWizardProps {
  onComplete?: () => void;
  embedded?: boolean;
}

const SETUP_ICONS: Record<string, React.ReactNode> = {
  star: <Star className="w-6 h-6 text-primary" />,
  gem: <Gem className="w-6 h-6 text-primary" />,
  lock: <Lock className="w-6 h-6 text-primary" />,
  help: <HelpCircle className="w-6 h-6 text-muted-foreground" />,
};

const PRESET_ICONS: Record<string, React.ReactNode> = {
  bolt: <Zap className="w-6 h-6 text-primary" />,
  scale: <Scale className="w-6 h-6 text-primary" />,
  brain: <Brain className="w-6 h-6 text-primary" />,
  lock: <Lock className="w-6 h-6 text-primary" />,
};

const ModelSetupWizard: React.FC<ModelSetupWizardProps> = ({ onComplete, embedded = false }) => {
  const currentConfig = useModelConfig();
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedPath, setSelectedPath] = useState<SetupPath>(currentConfig.setupPath);
  const [selectedPreset, setSelectedPreset] = useState<SmartPreset>(currentConfig.smartPreset);
  const [apiKey, setApiKey] = useState(currentConfig.apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [preferredModel, setPreferredModel] = useState(currentConfig.preferredModel);
  const [fallbackModel, setFallbackModel] = useState(currentConfig.fallbackModel);
  const [routingMode, setRoutingMode] = useState(currentConfig.routingMode);
  const [maxBudget, setMaxBudget] = useState(currentConfig.maxMonthlyBudget?.toString() ?? '');
  const [confirmed, setConfirmed] = useState(false);

  const needsApiKey = selectedPath === 'recommended' || selectedPath === 'premium';
  const totalSteps = needsApiKey ? 3 : selectedPath === 'unsure' ? 2 : 3;

  const handleFinish = () => {
    const providerMap: Record<SetupPath, ModelConfig['provider']> = {
      recommended: 'openrouter',
      premium: 'openai',
      local: 'ollama',
      unsure: 'openrouter',
    };

    updateModelConfig({
      setupPath: selectedPath,
      smartPreset: selectedPreset,
      provider: providerMap[selectedPath],
      apiKey: apiKey.trim(),
      preferredModel,
      fallbackModel,
      routingMode,
      maxMonthlyBudget: maxBudget ? parseFloat(maxBudget) : null,
    });

    setConfirmed(true);
    setTimeout(() => {
      onComplete?.();
    }, 1200);
  };

  if (confirmed) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-2">You're all set!</h2>
        <p className="text-sm text-muted-foreground">
          {selectedPath === 'unsure'
            ? 'We\'ve saved safe defaults. Come back here anytime to set up a model.'
            : 'Your model is configured. Your agents are ready to think.'}
        </p>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'max-w-3xl mx-auto'}>
      {/* Header */}
      {!embedded && (
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
            Power Up Your Agents
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
            Choose how your agents think. There's no wrong answer — you can change this anytime.
          </p>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6 max-w-xs mx-auto">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= wizardStep ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mb-6 font-medium">
        Step {wizardStep + 1} of {totalSteps}
      </p>

      {/* Step 0: Choose Setup Path */}
      {wizardStep === 0 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="font-display font-bold text-lg text-foreground">How do you want to power your agents?</h2>
            <p className="text-sm text-muted-foreground mt-1">Pick the option that feels right. No commitment.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SETUP_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedPath(opt.id)}
                className={`group text-left p-4 border rounded-xl transition-all duration-200 ${
                  selectedPath === opt.id
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:shadow-sm'
                } ${opt.id === 'unsure' ? 'border-dashed' : ''}`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="shrink-0 mt-0.5">{SETUP_ICONS[opt.icon] || <Star className="w-6 h-6" />}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-sm text-foreground leading-tight">{opt.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.summary}</p>
                  </div>
                  {selectedPath === opt.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <Badge variant="secondary" className="text-[10px] mb-2">{opt.bestFor}</Badge>

                <div className="space-y-1 mt-2">
                  {opt.pros.slice(0, 2).map((pro, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">{pro}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Difficulty:</span>
                    <span className="text-[10px] text-muted-foreground">{opt.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Cost:</span>
                    <span className="text-[10px] text-muted-foreground">{opt.costFeeling}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Smartness Presets */}
      {wizardStep === 1 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="font-display font-bold text-lg text-foreground">How smart should your agents be?</h2>
            <p className="text-sm text-muted-foreground mt-1">This picks the right model power level for you. You can always change it per agent.</p>
          </div>

          <div className="space-y-3">
            {SMART_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={`w-full text-left p-4 border rounded-xl transition-all duration-200 flex items-start gap-3 ${
                  selectedPreset === preset.id
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="shrink-0 mt-0.5">{PRESET_ICONS[preset.icon] || <Zap className="w-6 h-6" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm text-foreground">{preset.name}</h3>
                    {selectedPreset === preset.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{preset.feelsLike}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 italic">{preset.whenToChoose}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {preset.goodFor.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: API Key / Confirm */}
      {wizardStep === 2 && (
        <div className="space-y-5">
          {needsApiKey ? (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display font-bold text-lg text-foreground">
                  {selectedPath === 'recommended' ? 'Connect OpenRouter' : 'Connect Your Provider'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste your API key below. It's stored locally and never shared.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">API Key</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder={selectedPath === 'recommended' ? 'sk-or-...' : 'sk-...'}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    {selectedPath === 'recommended'
                      ? 'Get your key at openrouter.ai/keys — sign up is free, you only pay for what you use.'
                      : 'Get your key from your provider\'s dashboard (e.g., platform.openai.com/api-keys).'}
                  </p>
                </div>
              </div>
            </>
          ) : selectedPath === 'local' ? (
            <div className="text-center mb-6">
              <h2 className="font-display font-bold text-lg text-foreground">Local Setup</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Make sure Ollama is installed and running on your computer.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-xl text-left space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Quick start:</p>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Install Ollama from <span className="font-mono text-foreground">ollama.com</span></li>
                  <li>Open a terminal and run <span className="font-mono text-foreground">ollama pull llama3.2</span></li>
                  <li>Keep Ollama running in the background</li>
                </ol>
              </div>
            </div>
          ) : null}

          {/* Advanced Settings */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3 flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Advanced Settings</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showAdvanced && (
              <div className="p-4 pt-0 space-y-4 border-t border-border">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Preferred Model</Label>
                  <Input
                    value={preferredModel}
                    onChange={e => setPreferredModel(e.target.value)}
                    placeholder="e.g. gpt-4o, claude-3-sonnet, llama3.2"
                    className="mt-1 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Leave blank to use the default for your smartness preset.</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Fallback Model</Label>
                  <Input
                    value={fallbackModel}
                    onChange={e => setFallbackModel(e.target.value)}
                    placeholder="e.g. gpt-4o-mini"
                    className="mt-1 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Used if the preferred model is unavailable or over budget.</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Routing Mode</Label>
                  <div className="flex gap-2">
                    {(['cloud', 'local', 'hybrid'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setRoutingMode(mode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                          routingMode === mode
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Monthly Budget Limit ($)</Label>
                  <Input
                    type="number"
                    value={maxBudget}
                    onChange={e => setMaxBudget(e.target.value)}
                    placeholder="No limit"
                    className="mt-1 text-sm"
                    min="0"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Agents will pause when this limit is reached.</p>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Your setup</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Path</span>
                <span className="font-medium text-foreground">{SETUP_OPTIONS.find(o => o.id === selectedPath)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Smartness</span>
                <span className="font-medium text-foreground">{SMART_PRESETS.find(p => p.id === selectedPreset)?.name}</span>
              </div>
              {apiKey && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Key</span>
                  <span className="font-mono text-xs text-foreground">{'\u2022\u2022\u2022\u2022'}{apiKey.slice(-4)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reassurance */}
      <div className="mt-6 p-3 bg-muted/50 rounded-xl text-center">
        <p className="text-xs text-muted-foreground leading-relaxed flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            <span className="font-medium">Don't stress about this.</span> Every choice here can be changed later in Settings.
            {wizardStep === 0 && ' Pick what feels right — or choose "I\'m Not Sure Yet" and explore first.'}
            {wizardStep === 1 && ' Your agents will work with any preset. You can fine-tune per agent later.'}
            {wizardStep === 2 && ' Your key is stored locally and never shared. You\'re in control.'}
          </span>
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {wizardStep > 0 ? (
          <Button variant="outline" onClick={() => setWizardStep(s => s - 1)} className="flex-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        ) : (
          embedded ? null : <div className="flex-1" />
        )}
        {wizardStep < totalSteps - 1 ? (
          <Button
            onClick={() => {
              if (wizardStep === 0 && selectedPath === 'unsure') {
                setWizardStep(totalSteps - 1 > 1 ? 1 : 0);
              } else {
                setWizardStep(s => s + 1);
              }
            }}
            className="flex-1"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={needsApiKey && !apiKey.trim()}
            className="flex-1"
          >
            <Check className="w-4 h-4" />
            {selectedPath === 'unsure' ? 'Explore Without a Model' : 'Save & Continue'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModelSetupWizard;
