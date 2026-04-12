import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { backendApi } from '@/services/backendApi';
import {
  CheckCircle2, Copy, Check, Loader2, Terminal,
  ArrowRight, RefreshCw, AlertCircle, ExternalLink,
  ChevronRight, ShieldCheck, Cpu, BookOpen, Monitor,
} from 'lucide-react';

// ── Persistence ───────────────────────────────────────────────────────────────

const SETUP_COMPLETE_KEY = 'homeroom-setup-complete';

export function hasCompletedSetup(): boolean {
  return localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';
}

export function completeSetup(): void {
  localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
}

// ── Copy button ───────────────────────────────────────────────────────────────

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
    </button>
  );
};

// ── Terminal block ────────────────────────────────────────────────────────────

const TerminalBlock = ({ command }: { command: string }) => (
  <div className="flex items-center justify-between bg-[#0d1117] border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white/90">
    <span><span className="text-white/40 mr-2">$</span>{command}</span>
    <CopyButton text={command} />
  </div>
);

// ── "What is a terminal?" explainer ──────────────────────────────────────────

const WhatIsTerminal: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <Monitor className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground flex-1">What is a terminal?</span>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            A terminal (also called a command line, shell, or console) is an app where you type
            text commands directly to your computer instead of clicking buttons. It looks plain but
            it's incredibly powerful — developers use it to install software, run programs, and
            control their machine precisely.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">How to open one:</p>
            <div className="space-y-1.5">
              {[
                { os: 'Mac',     how: 'Press Command + Space, type "Terminal", press Enter. Or open Finder, then Applications, then Utilities, then Terminal.' },
                { os: 'Windows', how: 'Press Win + R, type "cmd" or "powershell", press Enter. Or search "Terminal" in the Start menu.' },
                { os: 'Linux',   how: 'Press Ctrl + Alt + T, or search your app launcher for "Terminal".' },
              ].map(({ os, how }) => (
                <div key={os} className="flex items-start gap-2">
                  <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded text-foreground shrink-0 mt-0.5">{os}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{how}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Once it's open, type the command shown above (or click the copy button and paste it with{' '}
            <kbd className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">Ctrl+V</kbd> on Windows or{' '}
            <kbd className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">Command+V</kbd> on Mac),
            then press <kbd className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">Enter</kbd> to run it.
          </p>
        </div>
      )}
    </div>
  );
};

// ── Doc link ──────────────────────────────────────────────────────────────────

const DocLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-xs"
  >
    {children}
    <ExternalLink className="w-3 h-3 shrink-0" />
  </a>
);

// ── Step indicator ────────────────────────────────────────────────────────────

const Steps = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <React.Fragment key={i}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          i < current ? 'bg-primary text-primary-foreground' :
          i === current ? 'bg-primary/20 text-primary border border-primary' :
          'bg-muted text-muted-foreground'
        }`}>
          {i < current ? <Check className="w-3 h-3" /> : i + 1}
        </div>
        {i < total - 1 && (
          <div className={`flex-1 h-px ${i < current ? 'bg-primary' : 'bg-border'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ── Wizard step accordion ─────────────────────────────────────────────────────

const WizardStep: React.FC<{
  number: number;
  title: string;
  prompt: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ number, title, prompt, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{number}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{prompt}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
};

// ── Answer row ────────────────────────────────────────────────────────────────

const AnswerRow: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <div className="flex items-start gap-3">
    <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-foreground shrink-0 mt-0.5 min-w-[80px] text-center">{label}</span>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-foreground">{value}</p>
      {note && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{note}</p>}
    </div>
  </div>
);

// ── Provider tabs ─────────────────────────────────────────────────────────────

type ProviderId = 'anthropic' | 'openai' | 'openrouter' | 'nous' | 'ollama';

const ProviderTabs: React.FC = () => {
  const [tab, setTab] = useState<ProviderId>('anthropic');

  const tabs: { id: ProviderId; label: string; sub: string }[] = [
    { id: 'anthropic',  label: 'Anthropic',    sub: 'Claude models' },
    { id: 'openai',     label: 'OpenAI',       sub: 'GPT models' },
    { id: 'openrouter', label: 'OpenRouter',   sub: '200+ models' },
    { id: 'nous',       label: 'Nous Portal',  sub: 'Hermes models' },
    { id: 'ollama',     label: 'Ollama',       sub: 'Local, free' },
  ];

  return (
    <div>
      {/* Tab bar — scrollable on small screens */}
      <div className="flex gap-1 mb-4 bg-muted p-1 rounded-lg overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 text-xs py-1.5 px-3 rounded-md font-medium transition-colors ${
              tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'anthropic' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-muted/40 rounded-lg mb-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get your API key from{' '}
              <DocLink href="https://console.anthropic.com/settings/keys">console.anthropic.com</DocLink>.
              Free trial credits are included on sign-up. No subscription required to start.
            </p>
          </div>
          <AnswerRow label="Select" value='"Anthropic (Claude models — API key or Claude Code)"' note="Third option in the list." />
          <AnswerRow label="Setup token" value='Press Enter to skip — leave it blank' note='You may see a "Paste setup-token (or Enter to cancel)" prompt. This is for Claude Code OAuth and does not apply here. Just press Enter.' />
          <AnswerRow label="API key" value="Paste your key — starts with sk-ant-..." />
          <AnswerRow label="Model" value="claude-haiku-4-5-20251001" note="Fast and cheap — good default for getting started. Upgrade to claude-sonnet-4-6 for more complex tasks, or claude-opus-4-6 for the most capable option." />
          <AnswerRow label="Vision setup" value="Skip for now" />
        </div>
      )}

      {tab === 'openai' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-muted/40 rounded-lg mb-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get your API key from{' '}
              <DocLink href="https://platform.openai.com/api-keys">platform.openai.com</DocLink>.
              Requires a paid account or free trial credits.
            </p>
          </div>
          <AnswerRow label="Select" value='"OpenAI Codex"' note="Fourth option in the list." />
          <AnswerRow label="API key" value="Paste your key — starts with sk-..." />
          <AnswerRow label="Model" value="gpt-4o" note="Best all-around for agent use. gpt-4o-mini is faster and cheaper for lighter tasks." />
          <AnswerRow label="Vision setup" value="Skip for now" />
        </div>
      )}

      {tab === 'openrouter' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-muted/40 rounded-lg mb-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get your API key from{' '}
              <DocLink href="https://openrouter.ai/keys">openrouter.ai</DocLink>.
              Free account, no credit card needed for free-tier models.
            </p>
          </div>
          <AnswerRow label="Select" value='"OpenRouter (100+ models, pay-per-use)"' note="Second option in the list." />
          <AnswerRow label="API key" value="Paste your key from openrouter.ai/keys" />
          <AnswerRow label="Model" value="meta-llama/llama-3.3-70b-instruct:free" note='The ":free" suffix picks the no-cost version. Also try "anthropic/claude-sonnet-4-5" if you have credits.' />
          <AnswerRow label="Vision setup" value="Skip for now" />
        </div>
      )}

      {tab === 'nous' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-muted/40 rounded-lg mb-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get your API key from{' '}
              <DocLink href="https://portal.nousresearch.com">portal.nousresearch.com</DocLink>.
              Free tier available. Hermes models are fine-tuned specifically for agent and tool use.
            </p>
          </div>
          <AnswerRow label="Select" value='"Nous Portal (Nous Research subscription)"' note="First option, pre-selected by default." />
          <AnswerRow label="API key" value="Paste your key from portal.nousresearch.com" />
          <AnswerRow label="Model" value="hermes-3-llama-3.1-70b" note="The flagship Hermes model. Excellent at tool use and multi-step reasoning." />
          <AnswerRow label="Vision setup" value="Skip for now" />
        </div>
      )}

      {tab === 'ollama' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-muted/40 rounded-lg mb-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ollama runs models locally on your machine. Completely free, nothing leaves your computer.
              Install it first if you haven't already:
            </p>
            <div className="mt-2">
              <TerminalBlock command="curl -fsSL https://ollama.com/install.sh | sh" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Then pull a model:
            </p>
            <div className="mt-1">
              <TerminalBlock command="ollama pull hermes3" />
            </div>
          </div>
          <AnswerRow label="Select" value='"More providers..."' note="Scroll to the bottom of the list — it is the second-to-last option." />
          <AnswerRow label="Then select" value='"Custom endpoint (enter URL manually)"' note="Ollama does not have its own named option. This is how you connect it." />
          <AnswerRow label="API base URL" value="http://localhost:11434/v1" note="Default Ollama address. Leave as-is unless you changed the port." />
          <AnswerRow label="API key" value="Press Enter to leave blank — no key needed" />
          <AnswerRow label="Model" value='Type "hermes3" or select from the list' />
          <AnswerRow label="Vision setup" value="Skip for now" />
        </div>
      )}
    </div>
  );
};


// ── Types ─────────────────────────────────────────────────────────────────────

type Issue = 'service' | 'runtime' | null;
type Step = 'service-down' | 'install' | 'configure' | 'verify' | 'done';

const STEP_INDEX: Record<Step, number> = {
  'service-down': 0,
  install: 1,
  configure: 2,
  verify: 3,
  done: 4,
};

// ── Main page ─────────────────────────────────────────────────────────────────

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const issue = searchParams.get('issue') as Issue;
  const returning = searchParams.get('returning') === 'true';

  const initialStep: Step = issue === 'service' ? 'service-down' : 'install';
  const [step, setStep] = useState<Step>(initialStep);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 'verify') return;
    const poll = setInterval(async () => {
      try {
        const h = await backendApi.getHealth();
        if (h.gatewayReachable) {
          clearInterval(poll);
          completeSetup();
          setStep('done');
        }
      } catch { /* backend not up yet */ }
    }, 3000);
    return () => clearInterval(poll);
  }, [step]);

  const verifyInstall = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const h = await backendApi.getHealth();
      if (h.gatewayReachable) {
        completeSetup();
        setStep('done');
      } else {
        setCheckError('Hermes not detected yet. Make sure you finished setup, then try again.');
      }
    } catch {
      setCheckError("Could not reach the backend service. Make sure it's running.");
    } finally {
      setChecking(false);
    }
  };

  const finish = () => navigate('/', { replace: true });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              H
            </div>
            <span className="font-display font-bold text-foreground text-sm">Homeroom</span>
            <span className="text-muted-foreground text-xs">· Install</span>
          </div>
          {returning && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/')}>
              Back to app
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-10">
        <Steps current={STEP_INDEX[step]} total={5} />

        {/* ── SERVICE DOWN ── */}
        {step === 'service-down' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground">
                  {returning ? 'Backend service stopped' : 'Welcome to Homeroom'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {returning
                    ? "The Homeroom service isn't reachable. Here's how to restart it."
                    : 'The backend service needs to be running first.'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-xl border border-border mb-6 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Backend service not detected</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Homeroom runs a local backend that stores your agents and manages runs.
                  Start it with <code className="font-mono bg-muted px-1 rounded">pnpm start</code> from the project root,
                  then reload this page.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs text-muted-foreground font-medium">START THE APP</p>
              <WhatIsTerminal />
              <TerminalBlock command="pnpm install && pnpm start" />
              <p className="text-xs text-muted-foreground">
                This starts both the backend service and the UI in one command.
                Your browser should auto-open when it's ready.{' '}
                <DocLink href="https://github.com/homeroom-ai/homeroom#getting-started">
                  Troubleshooting guide
                </DocLink>
              </p>
            </div>

            <div className="p-4 bg-card border border-border rounded-xl mb-6">
              <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                What does that command do?
              </p>
              <div className="space-y-2">
                {[
                  { cmd: 'pnpm install', desc: 'Downloads all the code dependencies Homeroom needs. Only needed once (or after updates).' },
                  { cmd: 'pnpm start',   desc: 'Starts the Homeroom backend service on port 3001 and opens the UI at localhost:5173.' },
                ].map(({ cmd, desc }) => (
                  <div key={cmd} className="flex items-start gap-3">
                    <code className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-foreground shrink-0 mt-0.5">{cmd}</code>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" /> I've started it — reload
            </Button>
          </div>
        )}

        {/* ── INSTALL HERMES ── */}
        {step === 'install' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground">
                  {returning ? 'Hermes runtime missing' : 'Install Hermes'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {returning
                    ? "Hermes isn't on your PATH. Re-install it with the command below."
                    : 'The AI runtime that runs your agents. Built by NousResearch.'}
                </p>
              </div>
            </div>

            {!returning && (
              <div className="p-4 bg-card border border-border rounded-xl mb-6">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  What is Hermes?
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hermes is an open-source AI agent runtime by{' '}
                  <DocLink href="https://nousresearch.com">NousResearch</DocLink>.
                  It's the program that executes your agents: it sends instructions to the AI model,
                  runs tools on your machine, maintains memory across sessions, and returns results.
                  Everything runs locally. Nothing is sent anywhere by default.{' '}
                  <DocLink href="https://github.com/NousResearch/hermes-agent">
                    View on GitHub
                  </DocLink>
                </p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Run this in your terminal
              </p>
              <WhatIsTerminal />
              <TerminalBlock command='curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash' />
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This downloads and runs the official Hermes installer. It adds the{' '}
                  <code className="font-mono bg-muted px-1 rounded">hermes</code> command to your PATH
                  and installs its dependencies automatically. Works on Mac, Linux, and WSL.
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg border border-border mb-6">
              <p className="text-xs font-medium text-foreground mb-2">Other install methods</p>
              <div className="space-y-1.5">
                {[
                  { label: 'npm',    cmd: 'npm install -g @nousresearch/hermes-agent' },
                  { label: 'pnpm',   cmd: 'pnpm add -g @nousresearch/hermes-agent' },
                ].map(({ label, cmd }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground shrink-0">{label}</span>
                    <code className="font-mono bg-muted px-1 rounded text-foreground">{cmd}</code>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => setStep('configure')}>
              Installed — next step <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── CONFIGURE HERMES ── */}
        {step === 'configure' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground">Configure Hermes</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The installer opens a setup wizard. Here's exactly what to pick at each step.
                </p>
              </div>
            </div>

            {/* Screen 1 */}
            <div className="p-4 bg-card border border-border rounded-xl mb-3">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                Screen 1: "How would you like to set up Hermes?"
              </p>
              <div className="space-y-1.5">
                <AnswerRow label="Select" value="Quick setup — provider, model &amp; messaging (recommended)" note="Press Enter to confirm. This covers everything you need without the advanced options." />
              </div>
            </div>

            {/* Screen 2 */}
            <div className="p-4 bg-card border border-border rounded-xl mb-3">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                Screen 2: "Connect a messaging platform? (Telegram, Discord, etc.)"
              </p>
              <div className="space-y-1.5">
                <AnswerRow
                  label="Select"
                  value='Skip — set up later with "hermes setup gateway"'
                  note="Homeroom is your visual interface. You don't need a bot gateway to use it. You can add messaging platforms any time later."
                />
              </div>
            </div>

            {/* Before you start */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-5">
              <p className="text-xs font-semibold text-foreground mb-1">Before you start</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you want to run models locally (free, nothing leaves your machine), install Ollama first.
                Get it from <DocLink href="https://ollama.com">ollama.com</DocLink> then run:
              </p>
              <div className="mt-2 space-y-1.5">
                <TerminalBlock command="ollama pull hermes3" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Skip this if you'd rather use a cloud provider like Nous Portal or OpenRouter.
              </p>
            </div>

            {/* Wizard walkthrough */}
            <p className="text-xs font-semibold text-foreground mb-3">Step-by-step wizard answers</p>

            <div className="space-y-2 mb-6">

              {/* Step 1: Provider */}
              <WizardStep
                number={1}
                title="Inference Provider"
                prompt='When you see "Choose how to connect to your main chat model"'
                defaultOpen
              >
                <ProviderTabs />
              </WizardStep>

              {/* Step 2: Terminal backend */}
              <WizardStep
                number={2}
                title="Terminal Backend"
                prompt='When you see "Choose where Hermes runs shell commands"'
              >
                <div className="space-y-2">
                  <AnswerRow label="Select" value="Local — run directly on this machine" />
                  <AnswerRow label="Working directory" value="Press Enter to accept the default (your home folder)" />
                  <AnswerRow label="Sudo support" value='Type "n" and press Enter — not needed for basic use' />
                </div>
              </WizardStep>

              {/* Step 3: Agent settings */}
              <WizardStep
                number={3}
                title="Agent Settings"
                prompt='When you see "Max iterations" and "Session Reset Policy"'
              >
                <div className="space-y-2">
                  <AnswerRow label="Max iterations" value="Press Enter to accept 90 (the default)" />
                  <AnswerRow label="Tool progress" value="Press Enter to accept the default" />
                  <AnswerRow label="Session reset" value="Choose option 1: Inactivity + daily reset (recommended)" />
                  <AnswerRow label="Inactivity timeout" value="Press Enter to accept 1440 minutes (the default)" />
                  <AnswerRow label="Daily reset hour" value="Press Enter to accept 4am (the default)" />
                </div>
              </WizardStep>

              {/* Step 4: Messaging — covered by Screen 2 card above, kept for completeness */}
              <WizardStep
                number={4}
                title="Messaging Platforms"
                prompt='If asked about Telegram, Discord, Slack, etc. inside the provider flow'
              >
                <div className="space-y-2">
                  <AnswerRow
                    label="Select"
                    value="Skip or deselect all — press Enter with nothing checked"
                    note="Already covered in Screen 2 above. If you see it again inside a sub-flow, skip it the same way."
                  />
                </div>
              </WizardStep>

              {/* Step 5: Tools */}
              <WizardStep
                number={5}
                title="Tools"
                prompt='When you see a list of tool categories to enable or disable'
              >
                <div className="space-y-2">
                  <AnswerRow label="What to do" value="Press Enter to accept the defaults" note="The default toolset covers file read/write, web search, and code execution. You can adjust this later." />
                </div>
              </WizardStep>

            </div>

            {/* Screen 3: Tool summary */}
            <div className="p-4 bg-card border border-border rounded-xl mb-3">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                Screen 3: "Tool Availability Summary"
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                You'll see a list showing which tool categories are active. Some will show as missing — that's normal. The missing ones need optional API keys for things like image generation or web search.
              </p>
              <div className="space-y-1.5">
                <AnswerRow label="Green ticks" value="Tools that are ready to use — no action needed" />
                <AnswerRow label="Red crosses" value="Optional tools that need extra API keys" note='You can add these later via "hermes setup tools" or by editing ~/.hermes/.env. You do not need them to get started.' />
              </div>
            </div>

            {/* Screen 4: Launch chat */}
            <div className="p-4 bg-card border border-border rounded-xl mb-5">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                Screen 4: "Launch hermes chat now? [Y/n]"
              </p>
              <div className="space-y-1.5">
                <AnswerRow label="Type" value="n and press Enter" note="Homeroom launches and manages agents for you. You don't need to use the terminal chat interface." />
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg border border-border mb-6">
              <p className="text-xs font-medium text-foreground mb-1">Setup complete. What's next?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Run <code className="font-mono bg-muted px-1 rounded">hermes doctor</code> if anything
                looks off. Otherwise click Verify below and Homeroom will confirm everything is connected.
              </p>
            </div>

            <div className="space-y-2">
              <Button className="w-full" size="lg" onClick={() => setStep('verify')}>
                Setup complete — verify <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep('install')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* ── VERIFY ── */}
        {step === 'verify' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground">
                  Verifying installation
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  One check to confirm Hermes is on your PATH.
                </p>
              </div>
            </div>

            <div className="p-4 bg-card border border-border rounded-xl mb-6">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                What we check
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Homeroom backend runs{' '}
                <code className="font-mono bg-muted px-1 rounded">hermes --version</code>{' '}
                and confirms it exits cleanly. Nothing is sent to any server — this is a local binary check only.
              </p>
            </div>

            {checkError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                <p className="text-sm text-destructive mb-2">{checkError}</p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Common fixes:</p>
                  {[
                    'Open a new terminal tab (PATH changes require a fresh shell)',
                    'Run hermes --version yourself to see the error',
                    'Run hermes doctor to diagnose issues automatically',
                  ].map(fix => (
                    <div key={fix} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                      {fix}
                    </div>
                  ))}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                    Check the{' '}
                    <DocLink href="https://github.com/NousResearch/hermes-agent/issues">
                      Hermes issue tracker
                    </DocLink>{' '}
                    for known install issues
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={verifyInstall} disabled={checking}>
                {checking
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</>
                  : 'Verify installation'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep('configure')}>
                Back to configure
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Checking automatically every 3 seconds...
            </p>
          </div>
        )}

        {/* ── DONE ── */}
        {step === 'done' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
              <div>
                <h1 className="font-display font-bold text-2xl text-foreground">
                  You're all set
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hermes is installed and the service is running.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {[
                { icon: CheckCircle2, text: 'Homeroom service running on localhost:3001', colour: 'text-emerald-500' },
                { icon: CheckCircle2, text: 'Hermes runtime found on PATH',               colour: 'text-emerald-500' },
                { icon: CheckCircle2, text: 'SQLite database initialised',                colour: 'text-emerald-500' },
              ].map(({ icon: Icon, text, colour }) => (
                <div key={text} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                  <Icon className={`w-4 h-4 shrink-0 ${colour}`} />
                  <span className="text-sm text-foreground">{text}</span>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Create your first agent and Homeroom will put it to work.
              You can add more AI providers and swap models from Settings any time.
            </p>

            <Button className="w-full" size="lg" onClick={finish}>
              Go to Homeroom <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupPage;
