import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ArrowLeft, Sparkles, ShieldCheck, Cpu, Lock,
  Globe, Terminal, Zap, Eye, BookOpen, ExternalLink,
  CheckCircle2, Network, Server, HardDrive, Users,
  AlertCircle, Info, Building2,
} from 'lucide-react';

// ── Persistence ───────────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'homeroom-onboarded';

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function completeOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

// ── Shared components ─────────────────────────────────────────────────────────

const DocLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
  >
    {children}
    <ExternalLink className="w-3 h-3 shrink-0" />
  </a>
);

const Callout: React.FC<{
  icon?: React.ElementType;
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'tip';
}> = ({ icon: Icon = Info, title, children, variant = 'default' }) => {
  const colours = {
    default: 'bg-primary/5 border-primary/20',
    warning: 'bg-amber-500/5 border-amber-500/20',
    tip:     'bg-emerald-500/5 border-emerald-500/20',
  }[variant];
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${colours}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
      <div>
        {title && <p className="font-semibold text-sm text-foreground mb-1">{title}</p>}
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

// A simple reusable bullet list
const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map(item => (
      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
        {item}
      </li>
    ))}
  </ul>
);

// Two-column comparison card
const CompareCard: React.FC<{
  icon: React.ElementType;
  label: string;
  sublabel: string;
  colour: string;
  pros: string[];
  cons: string[];
}> = ({ icon: Icon, label, sublabel, colour, pros, cons }) => (
  <div className="p-4 bg-card border border-border rounded-xl">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colour}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <p className="text-xs font-semibold text-emerald-600 mb-2">Works well for</p>
        <ul className="space-y-1">
          {pros.map(p => (
            <li key={p} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-semibold text-amber-600 mb-2">Trade-offs</p>
        <ul className="space-y-1">
          {cons.map(c => (
            <li key={c} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'welcome',        label: 'Welcome'            },
  { id: 'what-is-agent',  label: 'What is an agent'  },
  { id: 'good-bad',       label: 'Strengths'          },
  { id: 'local-cloud',    label: 'Local vs cloud'     },
  { id: 'orchestration',  label: 'Orchestration'      },
  { id: 'control',        label: 'Your control'       },
];

// ── Step 1: Welcome — all about Homeroom ─────────────────────────────────────

function WelcomeStep() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Building2 className="w-7 h-7 text-primary" />
      </div>

      <h1 className="font-display font-bold text-3xl text-foreground mb-4">
        Welcome to Homeroom
      </h1>

      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        If you've tried working with AI agents before, you've probably hit the same wall.
        APIs, config files, terminal tools, and documentation written for engineers.
        Powerful technology, built for the wrong audience.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Homeroom is built to fix that. It gives AI agents a visual home: a place where you create
        them, give them jobs, set rules on what they can and can't access, and actually see what
        they're doing. After an initial install, no terminal needed. Think of it as the easiest way to manage AI helpers
        visually instead of juggling chat windows, config files, or command line tools.
      </p>

      <div className="p-4 bg-card border border-border rounded-xl mb-4">
        <p className="font-semibold text-sm text-foreground mb-3">One place to manage it all</p>
        <Bullets items={[
          'Create agents and give them jobs',
          'Shape how they behave and respond',
          'Define what they should remember',
          'Set rules and limits on what they can access',
          'Connect tools (web search, file access, email, calendars, and more)',
          'Full auditability with time and date stamps of every action performed and why',
        ]} />
      </div>

      <div className="p-4 bg-card border border-border rounded-xl mb-6">
        <p className="font-semibold text-sm text-foreground mb-2">It looks like an office. That's intentional.</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          When you open Homeroom, you won't see a list of settings or a config panel. You'll see
          a virtual office space where your agents exist as characters, each with their own desk.
          You can see who's active, who's idle, and what each one is doing right now.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Each agent has a profile: a name, a role, a personality, a memory, a set of tools,
          and a full log of everything they've done. You manage them the same way you'd manage
          a small team. You hire them, brief them, set their boundaries, and check in on their work.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          It's built this way because invisible background processes are hard to trust.
          When you can see your agents, understand what they do, and read their history,
          you're far more likely to actually use them and use them well.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          The office is a visual layer. The real AI processes are still running underneath,
          doing actual work. Homeroom just gives you a way to see what they're doing, control
          what they can and cannot access, and manage all of it without touching the technical
          parts directly.
        </p>
      </div>

      <div className="p-4 bg-card border border-border rounded-xl mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="font-semibold text-sm text-foreground">Built with security as a default, not an afterthought</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Everything runs on your machine over localhost. No outbound connections are made unless
          you explicitly configure them. There are no default permissions. Agents can only access
          what you have specifically allowed.
        </p>
        <Bullets items={[
          'No surprise bills. Local models are free to run, the only cost is electricity. Cloud models only connect when you set them up, and you can set spending limits so nothing runs up a bill without you knowing.',
          'No default access. Agents start with no tools and no permissions. You grant them deliberately.',
          'No hidden traffic. All internal communication stays on the loopback interface.',
          'A safe place to learn. You can build, run, and experiment with agents without exposing anything until you are ready.',
          'Full audit trail. Every action is logged with a timestamp, what was done, and the reason behind it.',
        ]} />
      </div>

      <Callout icon={AlertCircle} variant="tip" title="Already familiar with AI agents?">
        Hit <strong>Skip intro</strong> below and we'll take you straight to the install.
      </Callout>
    </div>
  );
}

// ── Step 2: What is an AI agent ───────────────────────────────────────────────

function WhatIsAgentStep() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Sparkles className="w-7 h-7 text-primary" />
      </div>

      <h2 className="font-display font-bold text-2xl text-foreground mb-2">
        What is an AI agent?
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Most people are familiar with AI chat tools: you type a question, get an answer, and move on.
        That's useful, but an agent is a different kind of thing.
      </p>

      <div className="p-4 bg-card border border-border rounded-xl mb-6">
        <p className="font-semibold text-sm text-foreground mb-3">An AI agent is more like giving AI a real job.</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Instead of only replying once, an agent can follow instructions, remember useful context,
          use tools, and help with ongoing tasks over time.
        </p>
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="flex items-start gap-3">
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground shrink-0 mt-0.5">chatbot</span>
            <p className="text-sm text-muted-foreground">Something you talk to.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs font-mono bg-primary/10 px-2 py-0.5 rounded text-primary shrink-0 mt-0.5">agent</span>
            <p className="text-sm text-muted-foreground">Something you assign work to.</p>
          </div>
        </div>
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">That work might include</p>
      <Bullets items={[
        'Researching a topic and summarizing what it finds',
        'Writing a first draft based on a brief you give it',
        'Organizing information or notes',
        'Checking for updates and reporting back',
        'Monitoring systems or content for changes',
        'Handling repeatable tasks in the background',
      ]} />
    </div>
  );
}

// ── Step 2: What agents are good and not good at ──────────────────────────────

function GoodBadStep() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Users className="w-7 h-7 text-primary" />
      </div>

      <h2 className="font-display font-bold text-2xl text-foreground mb-2">
        What agents are good at. And what they're not.
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        Agents are powerful, but they are not magic. Being clear about this makes them
        much easier to use well.
      </p>

      <div className="space-y-6 mb-8">
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="font-semibold text-sm text-foreground mb-3">They work best when they have</p>
          <Bullets items={[
            'A clear role',
            'Clear instructions',
            'Clear boundaries on what they can access',
            'The right tools for the job',
          ]} />
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="font-semibold text-sm text-foreground mb-1">They're especially good at</p>
          <p className="text-xs text-muted-foreground mb-3">Tasks that are repetitive, structured, or time consuming.</p>
          <Bullets items={[
            'Research and summarizing',
            'Writing first drafts',
            'Monitoring and reporting',
            'Organizing notes and information',
            'Following repeatable routines',
            'Helping with multi step tasks',
          ]} />
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="font-semibold text-sm text-foreground mb-1">They're not good at</p>
          <p className="text-xs text-muted-foreground mb-3">These are the moments where your judgment still matters.</p>
          <Bullets items={[
            'Making important decisions on their own',
            'Handling unclear or messy situations without guidance',
            'Replacing human judgment on anything that matters',
            'Being trusted with unlimited access by default',
            'Always being correct without review',
          ]} />
        </div>
      </div>

      <Callout icon={ShieldCheck} title="That's why Homeroom is built around visibility and control.">
        You should always be able to understand what an agent does, what it can access, and when it runs.
      </Callout>
    </div>
  );
}

// ── Step 3: Local vs cloud models ─────────────────────────────────────────────

function LocalCloudStep() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Network className="w-7 h-7 text-primary" />
      </div>

      <h2 className="font-display font-bold text-2xl text-foreground mb-2">
        Models, local and cloud
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Before we get into where models run, it helps to understand what they actually are.
      </p>

      <div className="p-4 bg-card border border-border rounded-xl mb-4">
        <p className="font-semibold text-sm text-foreground mb-2">What is an AI model?</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          A model is a large file that has been trained on enormous amounts of text. Through that
          training, it learned patterns in language well enough to read, reason, write, and respond
          in a way that feels intelligent. It is not a person, it has no feelings, and it doesn't
          remember previous conversations unless given a memory system. But it is remarkably good
          at understanding and generating language.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Think of it like a very well read assistant that has processed more books, articles,
          and documents than any human could read in a lifetime. It does not know everything,
          and it can be wrong. But it is a powerful starting point.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Different models have different strengths. Some are faster and lighter, designed to run
          on everyday hardware. Others are larger and more capable, designed for complex reasoning.
          Choosing a model is a bit like choosing the right person for a job: the best one depends
          on what you need done.
        </p>
      </div>

      <div className="p-4 bg-card border border-border rounded-xl mb-6">
        <p className="font-semibold text-sm text-foreground mb-2">Well known models you may have heard of</p>
        <div className="space-y-2">
          {[
            { name: 'GPT-4o / GPT-5', who: 'OpenAI', note: 'Cloud. Strong general reasoning and coding. Powers ChatGPT.' },
            { name: 'Claude 3.5 / Claude 4', who: 'Anthropic', note: 'Cloud. Focused on safety, long context, and careful reasoning.' },
            { name: 'Gemini 2.0 / 2.5', who: 'Google', note: 'Cloud. Strong at multimodal tasks and long documents.' },
            { name: 'Llama 3', who: 'Meta', note: 'Open source. Can run locally on your own machine. Free to use.' },
            { name: 'Mistral', who: 'Mistral AI', note: 'Open source. Efficient and fast. Runs well locally on modest hardware.' },
            { name: 'Phi-4', who: 'Microsoft', note: 'Small and efficient. Designed to run on everyday hardware.' },
          ].map(({ name, who, note }) => (
            <div key={name} className="flex items-start gap-3 p-2.5 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{name} <span className="text-xs text-muted-foreground font-normal">by {who}</span></p>
                <p className="text-xs text-muted-foreground">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-card border border-border rounded-xl mb-6">
        <p className="font-semibold text-sm text-foreground mb-2">Where models run</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Most people assume AI always works through the internet. That's true for many popular
          tools, but it's not the only option. Models can run in two different places:
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2.5 bg-muted rounded-lg">
            <HardDrive className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">On your own machine</span>
          </div>
          <div className="flex items-center gap-3 p-2.5 bg-muted rounded-lg">
            <Globe className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">On someone else's servers, over the internet</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          That's the difference between local and cloud.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <CompareCard
          icon={HardDrive}
          label="Local models"
          sublabel="Runs on your computer"
          colour="bg-emerald-500/10 text-emerald-600"
          pros={['Privacy and control', 'Works without sending data out', 'Can run offline once set up', 'Self hosted setup']}
          cons={['May run slower', 'Depends on your hardware', 'Quality varies by model']}
        />
        <CompareCard
          icon={Globe}
          label="Cloud models"
          sublabel="Runs on a provider's servers"
          colour="bg-blue-500/10 text-blue-600"
          pros={['Easier to get started', 'Stronger reasoning', 'Faster for complex tasks', 'No hardware requirements']}
          cons={['Needs internet', 'Data sent to provider', 'May have usage costs']}
        />
      </div>

      <Callout icon={Info} title="Yes, you can run AI offline.">
        This surprises a lot of people. If you install a local model, it runs entirely on your
        computer with no internet required. Homeroom makes it clear which mode each agent is using,
        so you always know what's happening.
      </Callout>
    </div>
  );
}

// ── Step 4: What orchestration means ─────────────────────────────────────────

function OrchestrationStep() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Cpu className="w-7 h-7 text-primary" />
      </div>

      <h2 className="font-display font-bold text-2xl text-foreground mb-2">
        What orchestration means
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        You may have heard this word when people talk about agents. It sounds technical,
        but the idea is straightforward.
      </p>

      <div className="p-4 bg-card border border-border rounded-xl mb-4">
        <p className="font-semibold text-sm text-foreground mb-2">The model is the agent. But it needs limbs.</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          The AI model is the intelligence inside the agent. It's what does the thinking, the reasoning,
          and the generating. But on its own, it can only produce text. It can't actually do anything in the world.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tools are what give it the ability to act. Searching the web, reading a file, sending a message,
          checking a calendar. Think of the model as the brain and the tools as its limbs. Without tools,
          it can think but not move. With tools, it can get things done.
        </p>
      </div>

      <div className="p-4 bg-card border border-border rounded-xl mb-6">
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Orchestration is what keeps it all organized. It's the system that decides:
        </p>
        <Bullets items={[
          'When an agent runs',
          'Which tools it is allowed to use',
          'What steps it should take',
          'When it should stop',
          'When it needs your approval before continuing',
        ]} />
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">How the pieces fit together</p>
        {[
          { icon: Zap,      label: 'The model',       desc: 'The brain. Thinks, reasons, and generates responses.' },
          { icon: Terminal, label: 'Tools',            desc: 'The limbs. Give the agent the ability to actually do things.' },
          { icon: Network,  label: 'Orchestration',   desc: 'The system. Decides when to run, what to use, and when to stop.' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-center gap-4 p-3 bg-card border border-border rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-muted rounded-xl">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Without orchestration: </span>
            AI can only respond to messages. You are the one keeping track of everything.
          </p>
        </div>
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">With orchestration: </span>
            AI can take on real work, follow multi step processes, and fit into your actual routines.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Step 6: What you stay in control of ──────────────────────────────────────

function ControlStep() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <ShieldCheck className="w-7 h-7 text-primary" />
      </div>

      <h2 className="font-display font-bold text-2xl text-foreground mb-2">
        What you stay in control of
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Homeroom is built to keep the important parts visible. Agents can be helpful
        without becoming mysterious.
      </p>

      <div className="space-y-2 mb-8">
        {[
          { icon: Cpu,        text: 'Which model each agent uses. Selected from a dropdown. Clearly labelled, always visible, nothing hidden.' },
          { icon: Network,    text: 'Whether it runs locally on your machine or through a cloud provider' },
          { icon: Zap,        text: 'Whether it runs only when you ask or on a schedule in the background' },
          { icon: Terminal,   text: 'What tools it can use' },
          { icon: Lock,       text: 'What data it can access' },
          { icon: ShieldCheck, text: 'Whether it needs your approval before taking action' },
          { icon: Eye,        text: 'What happened the last time it ran' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm text-foreground">{text}</p>
          </div>
        ))}
      </div>

      <div className="p-5 bg-card border border-border rounded-xl mb-6">
        <p className="font-semibold text-sm text-foreground mb-3">The goal</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Make AI agents useful, understandable, and safe enough to actually use every day.
        </p>
        <div className="space-y-1.5">
          {[
            'Not just as a demo.',
            'Not just for engineers.',
            'Not just in a terminal.',
            'But as something you can set up, guide, trust, and live with.',
          ].map(line => (
            <p key={line} className="text-sm text-muted-foreground">{line}</p>
          ))}
        </div>
      </div>

      <Callout icon={BookOpen} title="Documentation">
        <DocLink href="https://github.com/homeroom-ai/homeroom/blob/main/README.md">
          README.md
        </DocLink>{' '}
        has the full install guide and troubleshooting steps.
        If anything in this setup flow is confusing or wrong, please{' '}
        <DocLink href="https://github.com/homeroom-ai/homeroom/issues">
          open an issue
        </DocLink>{' '}
        and we'll fix it.
      </Callout>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <div className="flex items-center gap-1 mb-10">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`flex-1 h-1 rounded-full transition-all duration-300 ${
          i < step ? 'bg-primary' : i === step ? 'bg-primary/50' : 'bg-muted'
        }`}
      />
    ))}
  </div>
);

// ── Step label ────────────────────────────────────────────────────────────────

const StepPill: React.FC<{ step: number; label: string; total: number }> = ({ step, label, total }) => (
  <div className="flex items-center justify-between mb-6">
    <span className="text-xs text-muted-foreground font-medium">{label}</span>
    <span className="text-xs text-muted-foreground">{step + 1} / {total}</span>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const STEP_SCREENS = [
  WelcomeStep,
  WhatIsAgentStep,
  GoodBadStep,
  LocalCloudStep,
  OrchestrationStep,
  ControlStep,
];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const isLast = step === total - 1;
  const StepScreen = STEP_SCREENS[step];

  const goToStep = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate('/setup');
  };

  const handleFinish = () => {
    completeOnboarding();
    navigate('/setup');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              H
            </div>
            <span className="font-display font-bold text-foreground text-sm">Homeroom</span>
            <span className="text-muted-foreground text-xs">· Setup</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <ProgressBar step={step} total={total} />
        <StepPill step={step} label={STEPS[step].label} total={total} />

        <div className="pb-8">
          <StepScreen />
        </div>

        <div className="flex items-center gap-3 mt-8">
          {step > 0 ? (
            <Button variant="outline" onClick={() => goToStep(step - 1)} className="flex-none">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground flex-none"
            onClick={handleSkip}
          >
            Skip intro
          </Button>

          <div className="flex-1" />

          {isLast ? (
            <Button onClick={handleFinish} size="lg" className="gap-2">
              Get started
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => goToStep(step + 1)} size="lg" className="gap-2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
