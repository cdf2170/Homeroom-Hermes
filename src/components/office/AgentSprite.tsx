import React from 'react';
import { Agent } from '@/types/agent';

interface AgentSpriteProps {
  agent: Agent;
  x: number;
  y: number;
  selected?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
}

/**
 * Classic 16-bit RPG sprite — chunky, friendly, clean lines.
 * Inspired by SNES/GBA era characters: bold shapes, minimal detail, big expressive eyes.
 */
const AgentSprite: React.FC<AgentSpriteProps> = ({ agent, x, y, selected, onClick, onHover }) => {
  const app = agent.appearance;
  const isAttention = agent.state === 'needs-attention' || agent.state === 'waiting';
  const isSleeping = agent.state === 'sleeping' || agent.state === 'offline';
  const isWorking = agent.state === 'working';

  const outfitDark = darken(app.outfitColor, 25);

  return (
    <g
      transform={`translate(${x - 16}, ${y - 20})`}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      style={{ cursor: 'pointer' }}
      className={isSleeping ? '' : 'animate-agent-idle'}
    >
      {/* Selection ring */}
      {selected && (
        <ellipse cx="16" cy="33" rx="12" ry="3" fill="none" stroke="hsl(25, 70%, 45%)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.85" />
      )}
      {isAttention && !selected && (
        <ellipse cx="16" cy="33" rx="12" ry="3" fill="none" stroke="hsl(45, 80%, 55%)" strokeWidth="1" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* Shadow */}
      <ellipse cx="16" cy="33" rx="10" ry="2.5" fill="rgba(0,0,0,0.08)" />

      {/* Feet — chunky boots */}
      <rect x="7" y="29" width="7" height="4" rx="1.5" fill={app.shoeColor || '#5D4E37'} />
      <rect x="18" y="29" width="7" height="4" rx="1.5" fill={app.shoeColor || '#5D4E37'} />

      {/* Legs */}
      <rect x="9" y="24" width="5" height="6" rx="1" fill={outfitDark} />
      <rect x="18" y="24" width="5" height="6" rx="1" fill={outfitDark} />

      {/* Body — rounded torso */}
      <rect x="6" y="15" width="20" height="11" rx="3" fill={app.outfitColor} />
      {/* Collar line */}
      <rect x="12" y="15" width="8" height="2" rx="1" fill={darken(app.outfitColor, 15)} opacity="0.4" />

      {/* Arms */}
      <rect x="2" y="16" width="5" height="8" rx="2" fill={app.outfitColor} />
      <rect x="25" y="16" width="5" height="8" rx="2" fill={app.outfitColor} />
      {/* Hands */}
      <circle cx="4.5" cy="25" r="2.5" fill={app.skinTone} />
      <circle cx="27.5" cy="25" r="2.5" fill={app.skinTone} />

      {/* Head — big round friendly head */}
      <rect x="5" y="1" width="22" height="16" rx="5" fill={app.skinTone} />

      {/* Hair — chunky cap style */}
      <rect x="4" y="0" width="24" height="8" rx="3" fill={app.hairColor} />
      {/* Side hair tufts */}
      <rect x="4" y="0" width="4" height="11" rx="2" fill={app.hairColor} />
      <rect x="24" y="0" width="4" height="11" rx="2" fill={app.hairColor} />

      {/* Eyes — big and friendly */}
      {isSleeping ? (
        <>
          {/* Closed eyes — happy arcs */}
          <path d="M9 10 Q11 12 13 10" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M19 10 Q21 12 23 10" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Big round eyes */}
          <circle cx="11" cy="10" r="3.5" fill="white" />
          <circle cx="21" cy="10" r="3.5" fill="white" />
          {/* Pupils */}
          <circle cx="12" cy="10.5" r="2" fill="#2a2a2a" />
          <circle cx="22" cy="10.5" r="2" fill="#2a2a2a" />
          {/* Highlights */}
          <circle cx="12.8" cy="9.5" r="0.8" fill="white" />
          <circle cx="22.8" cy="9.5" r="0.8" fill="white" />
        </>
      )}

      {/* Glasses */}
      {app.glasses !== 'none' && !isSleeping && (
        <>
          <circle cx="11" cy="10" r="4.5" fill="none" stroke="#666" strokeWidth="0.8" />
          <circle cx="21" cy="10" r="4.5" fill="none" stroke="#666" strokeWidth="0.8" />
          <line x1="15.5" y1="10" x2="16.5" y2="10" stroke="#666" strokeWidth="0.8" />
        </>
      )}

      {/* Mouth — small friendly smile */}
      {!isSleeping && (
        <path d="M13 14 Q16 16 19 14" fill="none" stroke="#888" strokeWidth="0.8" strokeLinecap="round" />
      )}

      {/* Headwear */}
      {app.headwear === 'cap' && (
        <>
          <rect x="3" y="-1" width="26" height="7" rx="2" fill="#556B5E" />
          <rect x="0" y="5" width="16" height="2.5" rx="1" fill="#556B5E" />
        </>
      )}
      {app.headwear === 'beanie' && (
        <rect x="4" y="-2" width="24" height="9" rx="4" fill="#8B5E3C" />
      )}
      {app.headwear === 'headband' && (
        <rect x="4" y="7" width="24" height="2.5" rx="1" fill={app.accentColor} />
      )}
      {app.headwear === 'beret' && (
        <ellipse cx="20" cy="1" rx="10" ry="5" fill="#4A5568" />
      )}

      {/* Badge — small initial on chest */}
      <circle cx="22" cy="20" r="3.5" fill={app.accentColor || app.outfitColor} stroke="white" strokeWidth="0.8" />
      {agent.name?.[0] && (
        <text x="22" y="22" textAnchor="middle" fontSize="4" fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
          {agent.name[0]}
        </text>
      )}

      {/* Status dot */}
      <circle
        cx="26" cy="3" r="3"
        fill={
          isWorking ? 'hsl(140, 50%, 45%)' :
          agent.state === 'on-break' ? 'hsl(200, 50%, 55%)' :
          isAttention ? 'hsl(45, 80%, 55%)' :
          isSleeping ? 'hsl(0, 0%, 65%)' :
          'hsl(30, 15%, 60%)'
        }
        stroke="white" strokeWidth="1.2"
      />

      {/* Sleeping Zs */}
      {isSleeping && (
        <g opacity="0.5">
          <text x="27" y="3" fontSize="5" fill="hsl(260, 25%, 55%)" fontWeight="bold">z</text>
          <text x="30" y="-1" fontSize="4" fill="hsl(260, 25%, 55%)" fontWeight="bold" opacity="0.5">z</text>
        </g>
      )}

      {/* Working sparkle */}
      {isWorking && (
        <g opacity="0.6">
          <circle cx="1" cy="20" r="1.2" fill="hsl(140, 50%, 50%)">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="1" cy="23" r="1.2" fill="hsl(140, 50%, 50%)">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
          </circle>
          <circle cx="1" cy="26" r="1.2" fill="hsl(140, 50%, 50%)">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </g>
  );
};

function darken(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch {
    return hex;
  }
}

export default AgentSprite;
