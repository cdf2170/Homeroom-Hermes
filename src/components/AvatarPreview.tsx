import React from 'react';
import { AgentAppearance } from '@/types/agent';

interface AvatarPreviewProps {
  appearance: AgentAppearance;
  name?: string;
  size?: number;
  className?: string;
}

/**
 * Classic 16-bit RPG avatar — chunky, friendly, clean lines.
 * Matches the AgentSprite style for consistency.
 */
const AvatarPreview: React.FC<AvatarPreviewProps> = ({ appearance: app, name = '', size, className = '' }) => {
  const outfitDark = darken(app.outfitColor, 25);

  return (
    <svg viewBox="0 0 64 76" className={className} style={size ? { width: size, height: size * (76 / 64) } : undefined}>
      {/* Shadow */}
      <ellipse cx="32" cy="72" rx="18" ry="4" fill="rgba(0,0,0,0.06)" />

      {/* Shoes */}
      <rect x="14" y="64" width="12" height="7" rx="3" fill={app.shoeColor || '#5D4E37'} />
      <rect x="38" y="64" width="12" height="7" rx="3" fill={app.shoeColor || '#5D4E37'} />

      {/* Legs */}
      <rect x="17" y="52" width="9" height="14" rx="2" fill={outfitDark} />
      <rect x="38" y="52" width="9" height="14" rx="2" fill={outfitDark} />

      {/* Body — rounded friendly torso */}
      <rect x="12" y="32" width="40" height="24" rx="6" fill={app.outfitColor} />
      {/* Collar */}
      <rect x="24" y="32" width="16" height="4" rx="2" fill={darken(app.outfitColor, 15)} opacity="0.4" />

      {/* Arms */}
      <rect x="3" y="34" width="10" height="16" rx="4" fill={app.outfitColor} />
      <rect x="51" y="34" width="10" height="16" rx="4" fill={app.outfitColor} />
      {/* Hands */}
      <circle cx="8" cy="52" r="5" fill={app.skinTone} />
      <circle cx="56" cy="52" r="5" fill={app.skinTone} />

      {/* Head — big round friendly */}
      <rect x="10" y="2" width="44" height="32" rx="10" fill={app.skinTone} />

      {/* Hair cap */}
      <rect x="8" y="0" width="48" height="16" rx="6" fill={app.hairColor} />
      {/* Side hair */}
      <rect x="8" y="0" width="8" height="22" rx="4" fill={app.hairColor} />
      <rect x="48" y="0" width="8" height="22" rx="4" fill={app.hairColor} />

      {/* Ears */}
      <circle cx="10" cy="20" r="4" fill={app.skinTone} />
      <circle cx="54" cy="20" r="4" fill={app.skinTone} />

      {/* Eyes — big and expressive */}
      <circle cx="22" cy="20" r="7" fill="white" />
      <circle cx="42" cy="20" r="7" fill="white" />
      {/* Pupils */}
      <circle cx="24" cy="21" r="4" fill="#2a2a2a" />
      <circle cx="44" cy="21" r="4" fill="#2a2a2a" />
      {/* Highlights */}
      <circle cx="25.5" cy="19" r="1.8" fill="white" />
      <circle cx="45.5" cy="19" r="1.8" fill="white" />

      {/* Glasses */}
      {app.glasses !== 'none' && (
        <>
          <circle cx="22" cy="20" r="9" fill="none" stroke="#666" strokeWidth="1.2" />
          <circle cx="42" cy="20" r="9" fill="none" stroke="#666" strokeWidth="1.2" />
          <line x1="31" y1="20" x2="33" y2="20" stroke="#666" strokeWidth="1.2" />
        </>
      )}

      {/* Nose — tiny dot */}
      <circle cx="32" cy="26" r="1.5" fill={darken(app.skinTone, 20)} opacity="0.2" />

      {/* Mouth — friendly smile */}
      <path d="M26 29 Q32 33 38 29" fill="none" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />

      {/* Headwear */}
      {app.headwear === 'cap' && (
        <>
          <rect x="6" y="-2" width="52" height="14" rx="4" fill="#556B5E" />
          <rect x="0" y="10" width="32" height="5" rx="2" fill="#556B5E" />
        </>
      )}
      {app.headwear === 'beanie' && (
        <rect x="8" y="-4" width="48" height="18" rx="8" fill="#8B5E3C" />
      )}
      {app.headwear === 'headband' && (
        <rect x="8" y="14" width="48" height="5" rx="2" fill={app.accentColor} />
      )}
      {app.headwear === 'beret' && (
        <ellipse cx="40" cy="2" rx="20" ry="10" fill="#4A5568" />
      )}

      {/* Blush */}
      {(app.bodyType === 'feminine' || app.bodyType === 'androgynous') && (
        <>
          <circle cx="16" cy="26" r="3" fill="#E8A0BF" opacity="0.12" />
          <circle cx="48" cy="26" r="3" fill="#E8A0BF" opacity="0.12" />
        </>
      )}

      {/* Badge */}
      <circle cx="44" cy="42" r="6" fill={app.accentColor} stroke="white" strokeWidth="1.5" />
      <text x="44" y="45" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
        {name?.[0] || ''}
      </text>
    </svg>
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

export default AvatarPreview;
