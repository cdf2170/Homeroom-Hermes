import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgent } from '@/hooks/api/useAgents';
import { backendApi } from '@/services/backendApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AvatarPreview from '@/components/AvatarPreview';
import {
  PartyPopper, Play, ArrowRight, Brain, Shield, Clock,
  Sparkles, CheckCircle2, Rocket, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { BackendRun } from '@/services/backendApi';

type Phase = 'celebrate' | 'first-task' | 'running' | 'result' | 'next-steps';

const AgentWelcomePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useAgent(id ?? '');
  const [phase, setPhase] = useState<Phase>('celebrate');
  const [taskInput, setTaskInput] = useState('');
  const [runResult, setRunResult] = useState<BackendRun | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Clean up poller on unmount
  useEffect(() => () => { if (pollInterval) clearInterval(pollInterval); }, [pollInterval]);

  if (isLoading) return null;

  if (!agent) {
    navigate('/agents');
    return null;
  }

  const suggestedTasks = [
    `Introduce yourself and explain what you can help with`,
    `Summarize what "${agent.role}" means in this context`,
    `Show me an example of your best work`,
  ];

  const handleRunTask = async (task: string) => {
    setPhase('running');
    setRunError(null);
    setRunResult(null);

    let run: BackendRun;
    try {
      run = await backendApi.runAgent(agent.id, task);
    } catch (e: any) {
      setRunError(e.message ?? 'Run failed');
      setPhase('result');
      return;
    }

    // Poll until the run settles
    const interval = setInterval(async () => {
      try {
        const runs = await backendApi.listRuns(agent.id);
        const current = runs.find(r => r.id === run.id);
        if (!current) return;
        if (current.status === 'completed' || current.status === 'failed' || current.status === 'cancelled') {
          clearInterval(interval);
          setPollInterval(null);
          setRunResult(current);
          setPhase('result');
        }
      } catch {
        // backend momentarily unreachable — keep polling
      }
    }, 1500);
    setPollInterval(interval);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {phase === 'celebrate' && (
          <div className="text-center space-y-6 animate-in fade-in duration-500">
            <div className="relative inline-block">
              <AvatarPreview appearance={agent.appearance} name={agent.name} size={120} className="mx-auto" />
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-status-working/10 flex items-center justify-center animate-bounce">
                <PartyPopper className="w-5 h-5 text-status-working" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">
                Meet {agent.name}!
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your new {agent.role.toLowerCase()} is ready to go
              </p>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl text-left space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="capitalize">{agent.vibe} · {agent.archetype}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <span className="capitalize">{agent.smartnessLevel} intelligence · {agent.runtimeMode}</span>
              </div>
              {agent.permissions && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>Approval required for actions</span>
                </div>
              )}
            </div>
            <Button className="w-full" onClick={() => setPhase('first-task')}>
              <Rocket className="w-4 h-4" /> Give {agent.name} their first task
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={() => navigate(`/agents/${agent.id}`)}>
              Skip — go to profile
            </Button>
          </div>
        )}

        {phase === 'first-task' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="text-center">
              <h2 className="font-display font-bold text-xl text-foreground">First task for {agent.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">Try something simple to see how they work</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Quick suggestions</p>
              {suggestedTasks.map((task, i) => (
                <button
                  key={i}
                  onClick={() => handleRunTask(task)}
                  className="w-full p-3 bg-card border border-border rounded-xl text-left hover:shadow-sm transition-all flex items-center gap-3"
                >
                  <Play className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{task}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Or write your own</p>
              <Textarea
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                placeholder={`What should ${agent.name} do first?`}
                className="min-h-[60px] text-sm resize-none"
              />
              <Button
                size="sm"
                className="w-full mt-2 text-xs"
                disabled={!taskInput.trim()}
                onClick={() => handleRunTask(taskInput.trim())}
              >
                <Play className="w-3 h-3" /> Run this task
              </Button>
            </div>
          </div>
        )}

        {phase === 'running' && (
          <div className="text-center space-y-6 animate-in fade-in duration-500">
            <AvatarPreview appearance={agent.appearance} name={agent.name} size={96} className="mx-auto" />
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">{agent.name} is working...</h2>
              <p className="text-sm text-muted-foreground mt-1">Waiting for the run to complete</p>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-pulse"
                  style={{ animationDelay: `${i * 300}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center">
              {runError || runResult?.status === 'failed' ? (
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-status-working/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-status-working" />
                </div>
              )}
              <h2 className="font-display font-bold text-xl text-foreground">
                {runError || runResult?.status === 'failed' ? 'Run failed' : 'First task complete!'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{agent.name} finished their first run</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {runError || runResult?.status === 'failed' ? 'Error' : 'Result'}
              </p>
              <p className="text-sm text-foreground">
                {runError
                  ?? runResult?.errorSummary
                  ?? runResult?.outputSummary
                  ?? 'No output recorded'}
              </p>
            </div>
            <Button className="w-full" onClick={() => setPhase('next-steps')}>
              <ArrowRight className="w-4 h-4" /> What's next?
            </Button>
          </div>
        )}

        {phase === 'next-steps' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="text-center">
              <h2 className="font-display font-bold text-xl text-foreground">Make {agent.name} even better</h2>
              <p className="text-sm text-muted-foreground mt-1">A few things to set up when you're ready</p>
            </div>
            <div className="space-y-2">
              {[
                { icon: Brain, label: 'Add memories', desc: 'Teach them facts and preferences they should remember', action: () => navigate(`/agents/${agent.id}`) },
                { icon: Shield, label: 'Set up rules', desc: 'Define boundaries for what they can and can\'t do', action: () => navigate(`/agents/${agent.id}`) },
                { icon: Clock, label: 'Create a schedule', desc: 'Have them run automatically on a timer', action: () => navigate(`/agents/${agent.id}`) },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="w-full p-3 bg-card border border-border rounded-xl text-left hover:shadow-sm transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={() => navigate(`/agents/${agent.id}`)}>
                Go to profile
              </Button>
              <Button className="flex-1 text-xs" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentWelcomePage;
