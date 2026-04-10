import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Agent, ROOM_BOUNDS, STATE_TO_ZONE, STATE_LABELS, OfficeZone } from '@/types/agent';
import AgentSprite from './AgentSprite';
import OfficeBackground from './OfficeBackground';

interface OfficeFloorProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string | null) => void;
}

/**
 * Positions agents inside their room bounds with a grid layout.
 * Agents NEVER appear outside their room walls.
 */
function getAgentPosition(agent: Agent, agents: Agent[]): { x: number; y: number } {
  const zone = STATE_TO_ZONE[agent.state];
  const room = ROOM_BOUNDS[zone];

  // Padding from room edges to keep sprites fully inside
  const pad = 20;
  const innerW = room.width - pad * 2;
  const innerH = room.height - pad * 2 - 20; // extra top padding for label

  const agentsInZone = agents.filter(a => STATE_TO_ZONE[a.state] === zone);
  const idx = agentsInZone.indexOf(agent);

  // Grid: columns first, then rows
  const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(agentsInZone.length))));
  const rows = Math.ceil(agentsInZone.length / cols);
  const col = idx % cols;
  const row = Math.floor(idx / cols);

  const cellW = innerW / cols;
  const cellH = innerH / Math.max(rows, 1);

  return {
    x: room.x + pad + col * cellW + cellW / 2,
    y: room.y + pad + 20 + row * cellH + cellH / 2,
  };
}

const OfficeFloor: React.FC<OfficeFloorProps> = ({ agents, selectedAgentId, onSelectAgent }) => {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  // Memoize positions so they don't jump every render
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    agents.forEach(a => {
      map.set(a.id, getAgentPosition(a, agents));
    });
    return map;
  }, [agents]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-muted/30 rounded-xl">
      <svg
        viewBox="0 0 900 600"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="woodGrain" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="hsl(35, 25%, 88%)" />
            <line x1="0" y1="8" x2="40" y2="8" stroke="hsl(30, 20%, 82%)" strokeWidth="0.3" />
            <line x1="0" y1="16" x2="40" y2="16" stroke="hsl(30, 20%, 83%)" strokeWidth="0.2" />
            <line x1="0" y1="24" x2="40" y2="24" stroke="hsl(30, 20%, 81%)" strokeWidth="0.35" />
            <line x1="0" y1="32" x2="40" y2="32" stroke="hsl(30, 20%, 82%)" strokeWidth="0.2" />
          </pattern>
          <pattern id="carpetTexture" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="hsl(260, 10%, 78%)" />
            <circle cx="1.5" cy="1.5" r="0.4" fill="hsl(260, 8%, 74%)" />
            <circle cx="4.5" cy="4.5" r="0.4" fill="hsl(260, 8%, 74%)" />
          </pattern>
          <pattern id="loungeRug" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="hsl(15, 25%, 72%)" />
            <rect x="2" y="2" width="6" height="6" fill="none" stroke="hsl(15, 20%, 66%)" strokeWidth="0.3" />
          </pattern>
          <linearGradient id="windowLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(200, 50%, 90%)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(200, 50%, 90%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(210, 40%, 65%)" />
            <stop offset="100%" stopColor="hsl(210, 30%, 55%)" />
          </linearGradient>
        </defs>

        <OfficeBackground />

        {/* === AGENTS === */}
        {agents.map((agent) => {
          const pos = positions.get(agent.id) || { x: 100, y: 100 };
          return (
            <motion.g
              key={agent.id}
              animate={{ x: pos.x, y: pos.y }}
              initial={{ x: pos.x, y: pos.y }}
              transition={{ type: 'spring', stiffness: 40, damping: 12, duration: 1.2 }}
            >
              <AgentSprite
                agent={agent}
                x={0}
                y={0}
                selected={selectedAgentId === agent.id}
                onClick={() => onSelectAgent(selectedAgentId === agent.id ? null : agent.id)}
                onHover={(h) => setHoveredAgent(h ? agent.id : null)}
              />
            </motion.g>
          );
        })}

        {/* Hover tooltip */}
        {hoveredAgent && !selectedAgentId && (() => {
          const agent = agents.find(a => a.id === hoveredAgent);
          if (!agent) return null;
          const pos = positions.get(agent.id);
          if (!pos) return null;
          return (
            <g transform={`translate(${pos.x - 45}, ${pos.y - 50})`}>
              <rect x="0" y="0" width="90" height="28" rx="6" fill="hsl(30, 10%, 15%)" opacity="0.9" />
              <text x="45" y="12" textAnchor="middle" fontSize="8" fill="white" fontFamily="Nunito, sans-serif" fontWeight="600">
                {agent.name}
              </text>
              <text x="45" y="22" textAnchor="middle" fontSize="6.5" fill="hsl(35, 20%, 75%)" fontFamily="Nunito, sans-serif">
                {STATE_LABELS[agent.state]}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
};

export default OfficeFloor;
