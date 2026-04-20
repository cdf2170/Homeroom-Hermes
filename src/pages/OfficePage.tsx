import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import OfficeFloor from '@/components/office/OfficeFloor';
import AgentInspector from '@/components/office/AgentInspector';
import WelcomeModal from '@/components/office/WelcomeModal';
import { useAgents } from '@/store/agentStore';
import { useAgentSimulation, useVisualOverrides } from '@/hooks/useAgentSimulation';

const OfficePage: React.FC = () => {
  const agents = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Start the visual-only simulation (does not mutate real agent state)
  useAgentSimulation();
  const visualOverrides = useVisualOverrides();

  // Merge visual overrides on top of real agent data for display only
  const displayAgents = useMemo(() =>
    agents.map(a => {
      const override = visualOverrides.get(a.id);
      return override ? { ...a, state: override.state, zone: override.zone } : a;
    }),
    [agents, visualOverrides],
  );

  const selectedAgent = displayAgents.find(a => a.id === selectedAgentId) || null;

  React.useEffect(() => {
    if (selectedAgentId && !agents.find(a => a.id === selectedAgentId)) {
      setSelectedAgentId(null);
    }
  }, [agents, selectedAgentId]);

  const workingCount = displayAgents.filter(a => a.state === 'working').length;
  const waitingCount = displayAgents.filter(a => a.state === 'waiting' || a.state === 'needs-attention').length;
  const breakCount = displayAgents.filter(a => a.state === 'on-break').length;
  const idleCount = displayAgents.filter(a => a.state === 'idle').length;

  return (
    <div className="h-full flex flex-col relative">
      <WelcomeModal />

      {/* Top HUD bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="font-display font-bold text-lg text-foreground">The Office</h1>
          <p className="text-xs text-muted-foreground">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} • {workingCount} working
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Working', count: workingCount, color: 'bg-status-working' },
            { label: 'Idle', count: idleCount, color: 'bg-status-idle' },
            { label: 'Waiting', count: waitingCount, color: 'bg-status-waiting' },
            { label: 'Break', count: breakCount, color: 'bg-status-break' },
          ].filter(s => s.count > 0).map(s => (
            <div key={s.label} className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full text-xs font-medium text-foreground">
              <span className={`w-2 h-2 rounded-full ${s.color}`} />
              {s.count} {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {agents.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">No agents yet.</p>
            <p className="text-xs text-muted-foreground">Create an agent to see the office come alive.</p>
          </div>
        </div>
      )}

      {/* Office scene + inspector */}
      {agents.length > 0 && (
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 p-2 min-h-0">
            <OfficeFloor
              agents={displayAgents}
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
            />
          </div>

          <AnimatePresence>
            {selectedAgent && (
              <motion.div
                className="agent-inspector shrink-0 p-2 pr-1"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AgentInspector agent={selectedAgent} onClose={() => setSelectedAgentId(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default OfficePage;
