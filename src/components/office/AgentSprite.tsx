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

function darken(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch { return hex; }
}

// ── Hair at sprite scale (head: x=5–27, top y=1) ─────────────────────────────

interface SpriteHairProps {
  style: Agent['appearance']['hairStyle'];
  color: string;
}

const SpriteHair: React.FC<SpriteHairProps> = ({ style, color }) => {
  const dk = darken(color, 25);
  switch (style) {
    case 'shaved':
      return <rect x="5" y="1" width="22" height="3" rx="1.5" fill={color} opacity="0.55" />;

    case 'buzz':
      return (
        <>
          <rect x="4" y="0" width="24" height="5" rx="2.5" fill={color} />
          <rect x="4" y="0" width="3" height="8"  rx="1.5" fill={color} />
          <rect x="25" y="0" width="3" height="8"  rx="1.5" fill={color} />
        </>
      );

    case 'long':
      return (
        <>
          <rect x="4" y="0" width="24" height="8" rx="3" fill={color} />
          <rect x="3" y="0" width="4" height="18" rx="2" fill={color} />
          <rect x="25" y="0" width="4" height="18" rx="2" fill={color} />
          <ellipse cx="5"  cy="18" rx="2" ry="1.5" fill={color} />
          <ellipse cx="27" cy="18" rx="2" ry="1.5" fill={color} />
        </>
      );

    case 'wavy':
      return (
        <>
          <rect x="4" y="0" width="24" height="7" rx="3" fill={color} />
          <path d="M3 9 C0 11 4 13 1 16 C-1 18 3 20 2 22"
            stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M29 9 C32 11 28 13 31 16 C33 18 29 20 30 22"
            stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      );

    case 'curly':
      return (
        <>
          <circle cx="8"  cy="3"  r="4"   fill={color} />
          <circle cx="13" cy="0"  r="4.5" fill={color} />
          <circle cx="19" cy="0"  r="4.5" fill={color} />
          <circle cx="24" cy="3"  r="4"   fill={color} />
          <circle cx="4"  cy="9"  r="3"   fill={color} />
          <circle cx="28" cy="9"  r="3"   fill={color} />
        </>
      );

    case 'afro':
      return (
        <>
          <ellipse cx="16" cy="0"  rx="13" ry="9"  fill={color} />
          <circle  cx="4"  cy="7"  r="5"           fill={color} />
          <circle  cx="28" cy="7"  r="5"           fill={color} />
        </>
      );

    case 'mohawk':
      return (
        <>
          <rect x="4" y="1" width="24" height="4" rx="2" fill={color} opacity="0.3" />
          <rect x="13" y="-5" width="6" height="12" rx="2.5" fill={color} />
          <ellipse cx="16" cy="-5" rx="4" ry="2.5" fill={color} />
        </>
      );

    case 'bun':
      return (
        <>
          <rect x="4" y="0" width="24" height="7" rx="3" fill={color} />
          <rect x="4" y="0" width="4" height="10" rx="2" fill={color} />
          <rect x="24" y="0" width="4" height="10" rx="2" fill={color} />
          <circle cx="16" cy="-4" r="6" fill={color} />
          <circle cx="16" cy="-4" r="3.5" fill="none" stroke={dk} strokeWidth="1" opacity="0.3" />
        </>
      );

    case 'ponytail':
      return (
        <>
          <rect x="4" y="0" width="24" height="7" rx="3" fill={color} />
          <rect x="4" y="0" width="4" height="11" rx="2" fill={color} />
          <rect x="24" y="2" width="5" height="16" rx="2.5" fill={color} />
          <rect x="24" y="7" width="5" height="3" rx="1" fill={dk} opacity="0.5" />
        </>
      );

    case 'braids':
      return (
        <>
          <rect x="4" y="0" width="24" height="7" rx="3" fill={color} />
          <rect x="3" y="7" width="4" height="14" rx="2" fill={color} />
          <rect x="25" y="7" width="4" height="14" rx="2" fill={color} />
          {[0, 1, 2].map(i => (
            <rect key={i} x="3"  y={9 + i * 4} width="4" height="1" rx="0.5" fill={dk} opacity="0.5" />
          ))}
          {[0, 1, 2].map(i => (
            <rect key={i} x="25" y={9 + i * 4} width="4" height="1" rx="0.5" fill={dk} opacity="0.5" />
          ))}
        </>
      );

    case 'short':
    default:
      return (
        <>
          <rect x="4" y="0" width="24" height="8" rx="3" fill={color} />
          <rect x="4" y="0" width="4" height="11" rx="2" fill={color} />
          <rect x="24" y="0" width="4" height="11" rx="2" fill={color} />
        </>
      );
  }
};

// ── Sprite ────────────────────────────────────────────────────────────────────

const AgentSprite: React.FC<AgentSpriteProps> = ({ agent, x, y, selected, onClick, onHover }) => {
  const app = agent.appearance;
  const isFem       = app.bodyType === 'feminine';
  const isAttention = agent.state === 'needs-attention' || agent.state === 'waiting';
  const isSleeping  = agent.state === 'sleeping' || agent.state === 'offline';
  const isWorking   = agent.state === 'working';
  const outfitDark  = darken(app.outfitColor, 25);
  const shoe        = app.shoeColor || '#5D4E37';

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
        <ellipse cx="16" cy="33" rx="12" ry="3" fill="none"
          stroke="hsl(25, 70%, 45%)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.85" />
      )}
      {isAttention && !selected && (
        <ellipse cx="16" cy="33" rx="12" ry="3" fill="none"
          stroke="hsl(45, 80%, 55%)" strokeWidth="1" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* Shadow */}
      <ellipse cx="16" cy="33" rx="10" ry="2.5" fill="rgba(0,0,0,0.08)" />

      {isFem ? (
        // ── Feminine body ──────────────────────────────────────────────────
        <>
          {/* Rounded shoes with tiny heel */}
          <rect x="9"  y="30" width="6" height="3" rx="1.5" fill={shoe} />
          <rect x="18" y="30" width="6" height="3" rx="1.5" fill={shoe} />
          <rect x="11" y="28" width="1.5" height="3" rx="0.5" fill={darken(shoe, 20)} />
          <rect x="20" y="28" width="1.5" height="3" rx="0.5" fill={darken(shoe, 20)} />

          {/* Skirt */}
          <path d="M10 23 C9 27 8 30 7 33 L25 33 C24 30 23 27 22 23 Z" fill={outfitDark} />

          {/* Narrow bodice */}
          <rect x="9" y="15" width="14" height="10" rx="3" fill={app.outfitColor} />
          <path d="M12 15 Q16 19 20 15" fill="none" stroke={darken(app.outfitColor, 18)} strokeWidth="0.8" opacity="0.5" />

          {/* Slim arms */}
          <rect x="4"  y="16" width="6" height="8" rx="2.5" fill={app.outfitColor} />
          <rect x="22" y="16" width="6" height="8" rx="2.5" fill={app.outfitColor} />
          <circle cx="7"  cy="25" r="2.2" fill={app.skinTone} />
          <circle cx="25" cy="25" r="2.2" fill={app.skinTone} />

          {/* Rounder head */}
          <ellipse cx="16" cy="9" rx="11" ry="10" fill={app.skinTone} />

          {/* Hair */}
          <SpriteHair style={app.hairStyle} color={app.hairColor} />

          {/* Ears */}
          <circle cx="5"  cy="10" r="2" fill={app.skinTone} />
          <circle cx="27" cy="10" r="2" fill={app.skinTone} />

          {/* Eyes */}
          {isSleeping ? (
            <>
              <path d="M9 10 Q11 12 13 10"  fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M19 10 Q21 12 23 10" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="11" cy="9"  r="3.5" fill="white" />
              <circle cx="21" cy="9"  r="3.5" fill="white" />
              <circle cx="12" cy="9.5" r="2"  fill="#2a2a2a" />
              <circle cx="22" cy="9.5" r="2"  fill="#2a2a2a" />
              <circle cx="12.8" cy="8.5" r="0.8" fill="white" />
              <circle cx="22.8" cy="8.5" r="0.8" fill="white" />
              {/* Eyelashes */}
              <path d="M8 6 Q11 4 14 6"  fill="none" stroke={darken(app.skinTone, 40)} strokeWidth="0.8" strokeLinecap="round" />
              <path d="M18 6 Q21 4 24 6" fill="none" stroke={darken(app.skinTone, 40)} strokeWidth="0.8" strokeLinecap="round" />
            </>
          )}

          {/* Blush */}
          {!isSleeping && (
            <>
              <circle cx="7"  cy="12" r="2.5" fill="#E8A0BF" opacity="0.3" />
              <circle cx="25" cy="12" r="2.5" fill="#E8A0BF" opacity="0.3" />
            </>
          )}

          {/* Glasses */}
          {app.glasses !== 'none' && !isSleeping && (
            <>
              <circle cx="11" cy="9" r="4.5" fill="none" stroke="#666" strokeWidth="0.8" />
              <circle cx="21" cy="9" r="4.5" fill="none" stroke="#666" strokeWidth="0.8" />
              <line x1="15.5" y1="9" x2="16.5" y2="9" stroke="#666" strokeWidth="0.8" />
            </>
          )}

          {!isSleeping && (
            <path d="M12 14 Q16 17 20 14" fill="none" stroke="#999" strokeWidth="0.8" strokeLinecap="round" />
          )}
        </>
      ) : (
        // ── Masculine body ─────────────────────────────────────────────────
        <>
          {/* Chunky boots */}
          <rect x="7"  y="29" width="7" height="4" rx="1.5" fill={shoe} />
          <rect x="18" y="29" width="7" height="4" rx="1.5" fill={shoe} />

          {/* Legs */}
          <rect x="9"  y="24" width="5" height="6" rx="1" fill={outfitDark} />
          <rect x="18" y="24" width="5" height="6" rx="1" fill={outfitDark} />

          {/* Wide torso */}
          <rect x="6" y="15" width="20" height="11" rx="3" fill={app.outfitColor} />
          <rect x="12" y="15" width="8" height="2" rx="1" fill={darken(app.outfitColor, 15)} opacity="0.4" />

          {/* Arms */}
          <rect x="2"  y="16" width="5" height="8" rx="2" fill={app.outfitColor} />
          <rect x="25" y="16" width="5" height="8" rx="2" fill={app.outfitColor} />
          <circle cx="4.5"  cy="25" r="2.5" fill={app.skinTone} />
          <circle cx="27.5" cy="25" r="2.5" fill={app.skinTone} />

          {/* Head */}
          <rect x="5" y="1" width="22" height="16" rx="5" fill={app.skinTone} />

          {/* Hair */}
          <SpriteHair style={app.hairStyle} color={app.hairColor} />

          {/* Ears */}
          <circle cx="5"  cy="10" r="2.5" fill={app.skinTone} />
          <circle cx="27" cy="10" r="2.5" fill={app.skinTone} />

          {/* Eyes */}
          {isSleeping ? (
            <>
              <path d="M9 10 Q11 12 13 10"  fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M19 10 Q21 12 23 10" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="11" cy="10"  r="3.5" fill="white" />
              <circle cx="21" cy="10"  r="3.5" fill="white" />
              <circle cx="12" cy="10.5" r="2"  fill="#2a2a2a" />
              <circle cx="22" cy="10.5" r="2"  fill="#2a2a2a" />
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

          {!isSleeping && (
            <path d="M13 14 Q16 16 19 14" fill="none" stroke="#888" strokeWidth="0.8" strokeLinecap="round" />
          )}
        </>
      )}

      {/* Headwear — shared */}
      {app.headwear === 'cap' && (
        <>
          <rect x="3" y="-1" width="26" height="7" rx="2" fill={darken(app.outfitColor, 15)} />
          <rect x="0" y="5"  width="16" height="2.5" rx="1" fill={darken(app.outfitColor, 15)} />
        </>
      )}
      {app.headwear === 'beanie' && (
        <rect x="4" y="-2" width="24" height="9" rx="4" fill={darken(app.outfitColor, 10)} />
      )}
      {app.headwear === 'headband' && (
        <rect x="4" y="7" width="24" height="2.5" rx="1" fill={app.accentColor} />
      )}
      {app.headwear === 'beret' && (
        <ellipse cx="20" cy="1" rx="10" ry="5" fill={darken(app.outfitColor, 20)} />
      )}

      {/* Badge */}
      <circle cx="22" cy="20" r="3.5" fill={app.accentColor || app.outfitColor} stroke="white" strokeWidth="0.8" />
      {agent.name?.[0] && (
        <text x="22" y="22" textAnchor="middle" fontSize="4" fill="white" fontWeight="bold"
          style={{ pointerEvents: 'none' }}>
          {agent.name[0]}
        </text>
      )}

      {/* Status dot */}
      <circle
        cx="26" cy="3" r="3"
        fill={
          isWorking   ? 'hsl(140, 50%, 45%)' :
          agent.state === 'on-break' ? 'hsl(200, 50%, 55%)' :
          isAttention ? 'hsl(45, 80%, 55%)' :
          isSleeping  ? 'hsl(0, 0%, 65%)' :
          'hsl(30, 15%, 60%)'
        }
        stroke="white" strokeWidth="1.2"
      />

      {/* Sleeping Zs */}
      {isSleeping && (
        <g opacity="0.5">
          <text x="27" y="3"  fontSize="5" fill="hsl(260, 25%, 55%)" fontWeight="bold">z</text>
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

export default AgentSprite;
