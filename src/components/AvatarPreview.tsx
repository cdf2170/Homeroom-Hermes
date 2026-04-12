import React from 'react';
import { AgentAppearance } from '@/types/agent';

interface AvatarPreviewProps {
  appearance: AgentAppearance;
  name?: string;
  size?: number;
  className?: string;
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

function lighten(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch { return hex; }
}

// ── Hair — each style has a distinct silhouette ──────────────────────────────

interface HairProps {
  style: AgentAppearance['hairStyle'];
  color: string;
  bodyType: AgentAppearance['bodyType'];
}

const Hair: React.FC<HairProps> = ({ style, color, bodyType }) => {
  const isFem = bodyType === 'feminine';
  // Head geometry
  const topY  = isFem ? 0 : 2;
  const lx    = isFem ? 12 : 9;   // left edge of head
  const rx    = isFem ? 52 : 55;  // right edge of head
  const cx    = 32;               // horizontal center
  const dark  = darken(color, 28);

  switch (style) {
    case 'shaved':
      // Barely-there stubble
      return <rect x={lx} y={topY} width={rx - lx} height="5" rx="2" fill={color} opacity="0.5" />;

    case 'buzz':
      return (
        <>
          <rect x={lx - 1} y={topY - 1} width={rx - lx + 2} height="9" rx="4" fill={color} />
          <rect x={lx - 1} y={topY} width="6" height="13" rx="3" fill={color} />
          <rect x={rx - 5} y={topY} width="6" height="13" rx="3" fill={color} />
        </>
      );

    case 'short':
      return (
        <>
          <rect x={lx - 1} y={topY - 2} width={rx - lx + 2} height="14" rx="6" fill={color} />
          <rect x={lx - 1} y={topY} width="8" height="20" rx="4" fill={color} />
          <rect x={rx - 7} y={topY} width="8" height="20" rx="4" fill={color} />
        </>
      );

    case 'long':
      return (
        <>
          <rect x={lx - 1} y={topY - 2} width={rx - lx + 2} height="14" rx="6" fill={color} />
          <rect x={lx - 2} y={topY} width="10" height={isFem ? 40 : 34} rx="5" fill={color} />
          <rect x={rx - 8} y={topY} width="10" height={isFem ? 40 : 34} rx="5" fill={color} />
          <ellipse cx={lx + 3}  cy={topY + (isFem ? 40 : 34)} rx="5" ry="3.5" fill={color} />
          <ellipse cx={rx - 3}  cy={topY + (isFem ? 40 : 34)} rx="5" ry="3.5" fill={color} />
        </>
      );

    case 'wavy': {
      const tailLen = isFem ? 42 : 36;
      return (
        <>
          <rect x={lx - 1} y={topY - 2} width={rx - lx + 2} height="14" rx="6" fill={color} />
          {/* Left wavy side */}
          <path
            d={`M${lx - 1} ${topY + 12}
                C${lx - 7} ${topY + 18} ${lx + 3} ${topY + 24}
                  ${lx - 5} ${topY + 30} C${lx - 9} ${topY + 36}
                  ${lx + 2} ${topY + 40} ${lx - 3} ${topY + tailLen}`}
            stroke={color} strokeWidth="9" fill="none" strokeLinecap="round"
          />
          {/* Right wavy side */}
          <path
            d={`M${rx + 1} ${topY + 12}
                C${rx + 7} ${topY + 18} ${rx - 3} ${topY + 24}
                  ${rx + 5} ${topY + 30} C${rx + 9} ${topY + 36}
                  ${rx - 2} ${topY + 40} ${rx + 3} ${topY + tailLen}`}
            stroke={color} strokeWidth="9" fill="none" strokeLinecap="round"
          />
        </>
      );
    }

    case 'curly':
      // Clusters of overlapping circles — only on top and sides, never over the face
      return (
        <>
          {/* Top row of curls */}
          <circle cx={lx + 7}  cy={topY + 5}  r="8" fill={color} />
          <circle cx={lx + 16} cy={topY + 1}  r="8" fill={color} />
          <circle cx={cx - 6}  cy={topY - 2}  r="9" fill={color} />
          <circle cx={cx + 6}  cy={topY - 2}  r="9" fill={color} />
          <circle cx={rx - 16} cy={topY + 1}  r="8" fill={color} />
          <circle cx={rx - 7}  cy={topY + 5}  r="8" fill={color} />
          {/* Side curls — ear height only, not over eyes */}
          <circle cx={lx - 2}  cy={topY + 14} r="6" fill={color} />
          <circle cx={lx - 2}  cy={topY + 22} r="6" fill={color} />
          <circle cx={rx + 2}  cy={topY + 14} r="6" fill={color} />
          <circle cx={rx + 2}  cy={topY + 22} r="6" fill={color} />
        </>
      );

    case 'afro':
      return (
        <>
          {/* Tighter afro — sits around head, not over face */}
          <ellipse cx={cx} cy={topY} rx="24" ry="18" fill={color} />
          {/* Side puffs */}
          <circle cx={lx - 2} cy={topY + 12} r="9" fill={color} />
          <circle cx={rx + 2} cy={topY + 12} r="9" fill={color} />
          {/* Texture dots */}
          {[-8, -2, 4, 10].map(dx =>
            [-5, 1, 7].map(dy => (
              <circle key={`${dx}-${dy}`} cx={cx + dx} cy={topY + dy} r="2"
                fill={darken(color, 22)} opacity="0.22" />
            ))
          )}
        </>
      );

    case 'mohawk':
      return (
        <>
          {/* Shaved sides — very minimal */}
          <rect x={lx} y={topY} width={rx - lx} height="5" rx="2" fill={color} opacity="0.3" />
          {/* Tall central strip */}
          <rect x={cx - 5} y={topY - 14} width="10" height="22" rx="4" fill={color} />
          {/* Slight fan at top */}
          <ellipse cx={cx} cy={topY - 14} rx="7" ry="5" fill={color} />
        </>
      );

    case 'bun':
      return (
        <>
          {/* Short base cap */}
          <rect x={lx - 1} y={topY - 1} width={rx - lx + 2} height="11" rx="5" fill={color} />
          <rect x={lx - 1} y={topY} width="7" height="15" rx="4" fill={color} />
          <rect x={rx - 6} y={topY} width="7" height="15" rx="4" fill={color} />
          {/* Bun sphere */}
          <circle cx={cx} cy={topY - 10} r="12" fill={color} />
          {/* Bun crease */}
          <circle cx={cx} cy={topY - 10} r="8" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.3" />
          <circle cx={cx} cy={topY - 10} r="4" fill="none" stroke={dark} strokeWidth="1"   opacity="0.2" />
        </>
      );

    case 'ponytail':
      return (
        <>
          {/* Cap */}
          <rect x={lx - 1} y={topY - 2} width={rx - lx + 2} height="13" rx="5" fill={color} />
          {/* Short left side */}
          <rect x={lx - 1} y={topY} width="8" height="17" rx="4" fill={color} />
          {/* Tail on the right */}
          <rect x={rx - 4} y={topY + 2} width="11" height={isFem ? 36 : 30} rx="6" fill={color} />
          <ellipse cx={rx + 1.5} cy={topY + (isFem ? 38 : 32)} rx="5.5" ry="4" fill={color} />
          {/* Hair tie */}
          <rect x={rx - 5} y={topY + 10} width="12" height="4" rx="2"
            fill={darken(color, 30)} opacity="0.6" />
        </>
      );

    case 'braids': {
      const braidLen = isFem ? 34 : 28;
      const segCount = 5;
      return (
        <>
          {/* Cap */}
          <rect x={lx - 1} y={topY - 2} width={rx - lx + 2} height="12" rx="5" fill={color} />
          {/* Left braid body */}
          <rect x={lx - 2} y={topY + 10} width="9" height={braidLen} rx="4" fill={color} />
          {/* Left braid segments */}
          {Array.from({ length: segCount }, (_, i) => (
            <rect key={i} x={lx - 2} y={topY + 13 + i * (braidLen / segCount)}
              width="9" height="2" rx="1" fill={dark} opacity="0.45" />
          ))}
          {/* Right braid body */}
          <rect x={rx - 7} y={topY + 10} width="9" height={braidLen} rx="4" fill={color} />
          {/* Right braid segments */}
          {Array.from({ length: segCount }, (_, i) => (
            <rect key={i} x={rx - 7} y={topY + 13 + i * (braidLen / segCount)}
              width="9" height="2" rx="1" fill={dark} opacity="0.45" />
          ))}
        </>
      );
    }

    default:
      return (
        <>
          <rect x={lx - 1} y={topY - 2} width={rx - lx + 2} height="14" rx="6" fill={color} />
          <rect x={lx - 1} y={topY} width="8" height="20" rx="4" fill={color} />
          <rect x={rx - 7} y={topY} width="8" height="20" rx="4" fill={color} />
        </>
      );
  }
};

// ── Glasses ───────────────────────────────────────────────────────────────────

const Glasses: React.FC<{ app: AgentAppearance }> = ({ app }) => {
  if (app.glasses === 'none') return null;
  if (app.glasses === 'round') return (
    <>
      <circle cx="22" cy="19" r="8" fill="none" stroke="#555" strokeWidth="1.5" />
      <circle cx="42" cy="19" r="8" fill="none" stroke="#555" strokeWidth="1.5" />
      <line x1="30" y1="19" x2="34" y2="19" stroke="#555" strokeWidth="1.5" />
    </>
  );
  if (app.glasses === 'square') return (
    <>
      <rect x="14" y="12" width="16" height="14" rx="2" fill="none" stroke="#555" strokeWidth="1.5" />
      <rect x="34" y="12" width="16" height="14" rx="2" fill="none" stroke="#555" strokeWidth="1.5" />
      <line x1="30" y1="19" x2="34" y2="19" stroke="#555" strokeWidth="1.5" />
    </>
  );
  return (
    <>
      <path d="M14 14 Q22 11 30 16 Q22 28 14 23 Z" fill="rgba(100,150,200,0.18)" stroke="#888" strokeWidth="1.2" />
      <path d="M34 14 Q42 11 50 16 Q42 28 34 23 Z" fill="rgba(100,150,200,0.18)" stroke="#888" strokeWidth="1.2" />
      <line x1="30" y1="18" x2="34" y2="18" stroke="#888" strokeWidth="1.2" />
    </>
  );
};

// ── Headwear ──────────────────────────────────────────────────────────────────

const Headwear: React.FC<{ app: AgentAppearance }> = ({ app }) => {
  const c = darken(app.outfitColor, 15);
  switch (app.headwear) {
    case 'cap':     return (<><rect x="6" y="-2" width="52" height="14" rx="4" fill={c} /><rect x="0" y="10" width="30" height="5" rx="2" fill={c} /></>);
    case 'beanie':  return <rect x="7" y="-5" width="50" height="19" rx="10" fill={darken(app.outfitColor, 10)} />;
    case 'headband':return <rect x="8" y="12" width="48" height="5" rx="2" fill={app.accentColor} />;
    case 'beret':   return <ellipse cx="40" cy="2" rx="22" ry="10" fill={darken(app.outfitColor, 20)} />;
    default:        return null;
  }
};

// ── Masculine ─────────────────────────────────────────────────────────────────

const MasculineBody: React.FC<{ app: AgentAppearance; name: string }> = ({ app, name }) => {
  const outfit     = app.outfitColor;
  const outfitDark = darken(outfit, 28);
  const skin       = app.skinTone;
  const shoe       = app.shoeColor || '#4A4A4A';

  return (
    <>
      <ellipse cx="32" cy="74" rx="22" ry="3.5" fill="rgba(0,0,0,0.08)" />

      {/* Chunky boots */}
      <rect x="12" y="63" width="15" height="9" rx="4" fill={shoe} />
      <rect x="37" y="63" width="15" height="9" rx="4" fill={shoe} />
      <rect x="11" y="69" width="17" height="3" rx="1.5" fill={darken(shoe, 20)} />
      <rect x="36" y="69" width="17" height="3" rx="1.5" fill={darken(shoe, 20)} />

      {/* Thick legs */}
      <rect x="15" y="50" width="12" height="16" rx="3" fill={outfitDark} />
      <rect x="37" y="50" width="12" height="16" rx="3" fill={outfitDark} />

      {/* Wide boxy torso */}
      <rect x="8" y="28" width="48" height="26" rx="6" fill={outfit} />
      <rect x="22" y="28" width="20" height="5" rx="2" fill={darken(outfit, 12)} opacity="0.35" />
      <rect x="34" y="34" width="10" height="8" rx="2" fill={darken(outfit, 18)} opacity="0.25" />

      {/* Broad arms */}
      <rect x="-1" y="30" width="12" height="20" rx="5" fill={outfit} />
      <rect x="53" y="30" width="12" height="20" rx="5" fill={outfit} />
      <circle cx="5"  cy="52" r="6" fill={skin} />
      <circle cx="59" cy="52" r="6" fill={skin} />

      {/* Head */}
      <rect x="10" y="2" width="44" height="28" rx="8" fill={skin} />

      {/* Hair */}
      <Hair style={app.hairStyle} color={app.hairColor} bodyType="masculine" />

      {/* Ears */}
      <circle cx="10" cy="18" r="5" fill={skin} />
      <circle cx="54" cy="18" r="5" fill={skin} />

      {/* Eyes */}
      <circle cx="22" cy="18" r="6.5" fill="white" />
      <circle cx="42" cy="18" r="6.5" fill="white" />
      <circle cx="24" cy="19" r="3.8" fill="#2a2a2a" />
      <circle cx="44" cy="19" r="3.8" fill="#2a2a2a" />
      <circle cx="25.5" cy="17.5" r="1.6" fill="white" />
      <circle cx="45.5" cy="17.5" r="1.6" fill="white" />

      {/* Thick flat eyebrows */}
      <rect x="16" y="10" width="13" height="3" rx="1.5" fill={darken(skin, 38)} />
      <rect x="35" y="10" width="13" height="3" rx="1.5" fill={darken(skin, 38)} />

      <Glasses app={app} />

      <circle cx="32" cy="24" r="1.8" fill={darken(skin, 22)} opacity="0.25" />
      <path d="M25 27 Q32 31 39 27" fill="none" stroke="#888" strokeWidth="1.3" strokeLinecap="round" />

      <Headwear app={app} />

      {/* Badge */}
      <circle cx="44" cy="40" r="6" fill={app.accentColor} stroke="white" strokeWidth="1.5" />
      <text x="44" y="43" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
        {name?.[0]?.toUpperCase() || ''}
      </text>
    </>
  );
};

// ── Feminine ──────────────────────────────────────────────────────────────────

const FeminineBody: React.FC<{ app: AgentAppearance; name: string }> = ({ app, name }) => {
  const outfit      = app.outfitColor;
  const outfitDark  = darken(outfit, 25);
  const skin        = app.skinTone;
  const shoe        = app.shoeColor || '#4A4A4A';

  return (
    <>
      <ellipse cx="32" cy="74" rx="18" ry="3" fill="rgba(0,0,0,0.07)" />

      {/* Rounded shoes with heel */}
      <rect x="17" y="65" width="11" height="6" rx="3" fill={shoe} />
      <rect x="36" y="65" width="11" height="6" rx="3" fill={shoe} />
      <rect x="22" y="62" width="3.5" height="5" rx="1" fill={darken(shoe, 22)} />
      <rect x="38.5" y="62" width="3.5" height="5" rx="1" fill={darken(shoe, 22)} />

      {/* Skirt / A-line dress */}
      <path d="M 19 46 C 16 54 13 61 12 66 L 52 66 C 51 61 48 54 45 46 Z" fill={outfitDark} />
      <path d="M 24 46 C 22 55 20 61 19 66" fill="none" stroke={lighten(outfitDark, 15)} strokeWidth="1" opacity="0.5" />
      <path d="M 40 46 C 42 55 44 61 45 66" fill="none" stroke={lighten(outfitDark, 15)} strokeWidth="1" opacity="0.5" />

      {/* Narrow bodice */}
      <rect x="17" y="28" width="30" height="20" rx="6" fill={outfit} />
      <path d="M 26 28 Q 32 36 38 28" fill="none" stroke={darken(outfit, 18)} strokeWidth="1.8" opacity="0.5" />
      <rect x="17" y="44" width="30" height="3" rx="1.5" fill={outfitDark} opacity="0.4" />

      {/* Slimmer arms */}
      <rect x="5"  y="30" width="13" height="17" rx="6" fill={outfit} />
      <rect x="46" y="30" width="13" height="17" rx="6" fill={outfit} />
      <circle cx="11.5" cy="49" r="5" fill={skin} />
      <circle cx="52.5" cy="49" r="5" fill={skin} />

      {/* Rounder head */}
      <ellipse cx="32" cy="17" rx="20" ry="18" fill={skin} />

      {/* Hair */}
      <Hair style={app.hairStyle} color={app.hairColor} bodyType="feminine" />

      {/* Ears */}
      <circle cx="12" cy="18" r="4" fill={skin} />
      <circle cx="52" cy="18" r="4" fill={skin} />

      {/* Eyes */}
      <circle cx="23" cy="17" r="7" fill="white" />
      <circle cx="41" cy="17" r="7" fill="white" />
      <circle cx="24.5" cy="18" r="4" fill="#2a2a2a" />
      <circle cx="42.5" cy="18" r="4" fill="#2a2a2a" />
      <circle cx="26"   cy="16" r="1.8" fill="white" />
      <circle cx="44"   cy="16" r="1.8" fill="white" />

      {/* Eyelashes */}
      <path d="M16 10 Q23 7 30 10" fill="none" stroke={darken(skin, 42)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M34 10 Q41 7 48 10" fill="none" stroke={darken(skin, 42)} strokeWidth="1.5" strokeLinecap="round" />

      {/* Blush */}
      <circle cx="15" cy="23" r="4.5" fill="#E8A0BF" opacity="0.28" />
      <circle cx="49" cy="23" r="4.5" fill="#E8A0BF" opacity="0.28" />

      <Glasses app={app} />

      <circle cx="32" cy="23" r="1.3" fill={darken(skin, 18)} opacity="0.2" />
      <path d="M24 27 Q32 33 40 27" fill="none" stroke="#999" strokeWidth="1.2" strokeLinecap="round" />

      <Headwear app={app} />

      {/* Badge */}
      <circle cx="38" cy="38" r="5.5" fill={app.accentColor} stroke="white" strokeWidth="1.5" />
      <text x="38" y="41" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
        {name?.[0]?.toUpperCase() || ''}
      </text>
    </>
  );
};

// ── Root component ────────────────────────────────────────────────────────────

const AvatarPreview: React.FC<AvatarPreviewProps> = ({ appearance: app, name = '', size, className = '' }) => (
  <svg viewBox="0 0 64 78" className={className} style={size ? { width: size, height: size * (78 / 64) } : undefined}>
    {app.bodyType === 'feminine'
      ? <FeminineBody app={app} name={name} />
      : <MasculineBody app={app} name={name} />
    }
  </svg>
);

export default AvatarPreview;
