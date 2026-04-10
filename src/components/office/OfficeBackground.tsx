import React from 'react';
import { ROOM_BOUNDS, OfficeZone } from '@/types/agent';

/** The entire static office background — walls, rooms, furniture, decorations. 
 *  Canvas is 900×600.
 */
const OfficeBackground: React.FC = () => {
  const R = ROOM_BOUNDS;

  return (
    <g>
      {/* === FLOOR BASE === */}
      <rect x="10" y="10" width="870" height="580" rx="14" fill="hsl(30, 30%, 82%)" />
      <rect x="14" y="14" width="862" height="572" rx="12" fill="url(#woodGrain)" />

      {/* === OUTER WALLS === */}
      <rect x="10" y="10" width="870" height="580" rx="14" fill="none" stroke="hsl(35, 15%, 55%)" strokeWidth="6" />

      {/* === WINDOWS across top === */}
      {[60, 150, 500, 590, 720, 810].map((wx) => (
        <g key={`win-${wx}`}>
          <rect x={wx} y="8" width="50" height="10" fill="hsl(200, 45%, 82%)" rx="2" />
          <line x1={wx + 25} y1="8" x2={wx + 25} y2="18" stroke="hsl(35, 15%, 65%)" strokeWidth="0.8" />
          <rect x={wx} y="18" width="50" height="25" fill="url(#windowLight)" />
        </g>
      ))}

      {/* ============================================ */}
      {/* ROOM: WORK AREA (top-left) */}
      {/* ============================================ */}
      {/* Right wall of work area */}
      <line x1="310" y1="14" x2="310" y2="240" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      {/* Bottom wall of work area */}
      <line x1="14" y1="240" x2="310" y2="240" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      {/* Door in bottom wall */}
      <rect x="200" y="238" width="40" height="6" fill="url(#woodGrain)" />

      <text x={R.work.x + 12} y={R.work.y + 18} fontSize="9" fill="hsl(30, 8%, 55%)" fontFamily="Space Grotesk, sans-serif" fontWeight="600" opacity="0.5" letterSpacing="1.5">WORK AREA</text>

      {/* Desks in work area */}
      {[
        { x: 50, y: 70 },
        { x: 160, y: 70 },
        { x: 50, y: 150 },
        { x: 160, y: 150 },
      ].map((d, i) => (
        <g key={`wdesk-${i}`}>
          <rect x={d.x} y={d.y} width="75" height="45" rx="3" fill="hsl(25, 25%, 52%)" />
          <rect x={d.x + 2} y={d.y + 2} width="71" height="41" rx="2" fill="hsl(25, 25%, 58%)" />
          {/* Monitor */}
          <rect x={d.x + 22} y={d.y + 4} width="28" height="18" rx="2" fill="hsl(220, 15%, 20%)" />
          <rect x={d.x + 24} y={d.y + 6} width="24" height="13" rx="1" fill="url(#screenGlow)" className="animate-monitor-glow" />
          <rect x={d.x + 32} y={d.y + 22} width="6" height="3" rx="1" fill="hsl(220, 10%, 30%)" />
          {/* Keyboard */}
          <rect x={d.x + 18} y={d.y + 28} width="30" height="7" rx="2" fill="hsl(0, 0%, 80%)" />
          {/* Mouse */}
          <ellipse cx={d.x + 58} cy={d.y + 32} rx="3" ry="4" fill="hsl(0, 0%, 82%)" />
          {/* Chair */}
          <ellipse cx={d.x + 38} cy={d.y + 55} rx="13" ry="8" fill="hsl(30, 20%, 42%)" opacity="0.45" />
          {/* Coffee/notebook */}
          {i % 2 === 0 ? (
            <circle cx={d.x + 66} cy={d.y + 12} r="3.5" fill="hsl(0, 0%, 92%)" />
          ) : (
            <rect x={d.x + 4} y={d.y + 8} width="10" height="14" rx="0.5" fill="hsl(45, 50%, 85%)" />
          )}
        </g>
      ))}

      {/* Filing cabinet */}
      <rect x="265" y="60" width="28" height="50" rx="2" fill="hsl(200, 8%, 55%)" />
      <rect x="268" y="63" width="22" height="12" rx="1" fill="hsl(200, 8%, 60%)" />
      <rect x="268" y="78" width="22" height="12" rx="1" fill="hsl(200, 8%, 60%)" />
      <rect x="268" y="93" width="22" height="12" rx="1" fill="hsl(200, 8%, 60%)" />

      {/* Potted plant in work area corner */}
      <g transform="translate(34, 210)">
        <ellipse cx="0" cy="12" rx="10" ry="3" fill="hsl(30, 12%, 30%)" opacity="0.14" />
        <path d="M-1 4 C-10 -2 -11 -12 -4 -18 C2 -12 4 -3 -1 4Z" fill="hsl(140, 28%, 44%)" />
        <path d="M1 3 C9 -1 11 -10 4 -16 C-1 -11 -2 -2 1 3Z" fill="hsl(145, 32%, 40%)" />
        <path d="M-3 2 C-5 -6 -2 -14 3 -18 C5 -10 2 -3 -3 2Z" fill="hsl(132, 24%, 46%)" />
        <path d="M-5 4 H5 L4 12 H-4 Z" fill="hsl(24, 28%, 48%)" />
        <rect x="-4" y="4" width="8" height="1.5" rx="0.7" fill="hsl(24, 22%, 58%)" opacity="0.7" />
      </g>

      {/* Wall clock */}
      <g transform="translate(165, 32)">
        <circle cx="0" cy="0" r="9" fill="hsl(0, 0%, 95%)" stroke="hsl(30, 15%, 55%)" strokeWidth="1.5" />
        <line x1="0" y1="0" x2="3" y2="-5" stroke="hsl(30, 15%, 30%)" strokeWidth="1" strokeLinecap="round" />
        <line x1="0" y1="0" x2="-2" y2="-6" stroke="hsl(30, 15%, 40%)" strokeWidth="0.6" strokeLinecap="round" />
        <circle cx="0" cy="0" r="1" fill="hsl(30, 15%, 40%)" />
      </g>

      {/* ============================================ */}
      {/* CORRIDOR (center strip y:240 to y:370) */}
      {/* ============================================ */}
      {/* Horizontal corridor walls */}
      <line x1="14" y1="370" x2="310" y2="370" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      <line x1="440" y1="240" x2="660" y2="240" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      <line x1="440" y1="370" x2="870" y2="370" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      {/* Vertical corridor walls */}
      <line x1="310" y1="240" x2="310" y2="370" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      <line x1="440" y1="240" x2="440" y2="370" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      {/* Door from corridor to meeting */}
      <rect x="438" y="140" width="6" height="36" fill="url(#woodGrain)" />
      {/* Door from corridor to lounge */}
      <rect x="520" y="368" width="40" height="6" fill="url(#woodGrain)" />
      {/* Door from corridor to quiet */}
      <rect x="120" y="368" width="40" height="6" fill="url(#woodGrain)" />

      {/* Help desk in corridor */}
      <text x="342" y="275" fontSize="8" fill="hsl(30, 8%, 55%)" fontFamily="Space Grotesk, sans-serif" fontWeight="600" opacity="0.5" letterSpacing="1">HELP DESK</text>
      <rect x="340" y="290" width="70" height="30" rx="5" fill="hsl(25, 30%, 48%)" />
      <rect x="343" y="293" width="64" height="24" rx="3" fill="hsl(25, 32%, 55%)" />
      {/* Bell */}
      <circle cx="375" cy="303" r="4" fill="hsl(45, 70%, 65%)" />
      <circle cx="375" cy="301" r="1.5" fill="hsl(45, 80%, 80%)" />
      {/* In tray */}
      <rect x="348" y="298" width="14" height="8" rx="1" fill="hsl(0, 0%, 88%)" />

      {/* Water cooler in corridor */}
      <g transform="translate(410, 340)">
        <rect x="-7" y="0" width="14" height="18" rx="2" fill="hsl(0, 0%, 80%)" />
        <rect x="-4" y="-8" width="8" height="10" rx="3" fill="hsl(200, 40%, 82%)" opacity="0.6" />
      </g>

      {/* Shelf on corridor wall */}
      <rect x="315" y="248" width="120" height="8" rx="2" fill="hsl(25, 20%, 48%)" />
      {/* Books */}
      {[320, 327, 334, 341, 348, 355, 362].map((bx, i) => (
        <rect key={`book-${i}`} x={bx} y={243 - (i % 3)} width="5" height={9 + (i % 3)} rx="0.5" fill={`hsl(${[0, 200, 45, 140, 280, 15, 330][i]}, ${40 + i * 5}%, 55%)`} />
      ))}

      {/* ============================================ */}
      {/* ROOM: MEETING ROOM (top-center) */}
      {/* ============================================ */}
      <line x1="440" y1="14" x2="440" y2="240" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      <line x1="660" y1="14" x2="660" y2="240" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />

      <text x={R.meeting.x + 12} y={R.meeting.y + 18} fontSize="9" fill="hsl(30, 8%, 55%)" fontFamily="Space Grotesk, sans-serif" fontWeight="600" opacity="0.5" letterSpacing="1.5">MEETING ROOM</text>

      {/* Meeting table */}
      <rect x="480" y="85" width="120" height="65" rx="8" fill="hsl(25, 20%, 45%)" />
      <rect x="483" y="88" width="114" height="59" rx="6" fill="hsl(25, 22%, 52%)" />
      {/* Chairs */}
      {[
        { cx: 510, cy: 76 }, { cx: 570, cy: 76 },
        { cx: 510, cy: 160 }, { cx: 570, cy: 160 },
        { cx: 472, cy: 118 }, { cx: 608, cy: 118 },
      ].map((c, i) => (
        <ellipse key={`mc-${i}`} cx={c.cx} cy={c.cy} rx={i > 3 ? 6 : 10} ry={i > 3 ? 10 : 6} fill="hsl(30, 18%, 40%)" opacity="0.4" />
      ))}
      {/* Whiteboard */}
      <rect x="620" y="50" width="30" height="45" rx="2" fill="hsl(0, 0%, 96%)" stroke="hsl(0, 0%, 78%)" strokeWidth="1" />
      <line x1="624" y1="60" x2="644" y2="60" stroke="hsl(210, 50%, 55%)" strokeWidth="0.6" opacity="0.5" />
      <line x1="624" y1="67" x2="640" y2="67" stroke="hsl(0, 50%, 55%)" strokeWidth="0.6" opacity="0.4" />
      <line x1="624" y1="74" x2="642" y2="74" stroke="hsl(140, 40%, 50%)" strokeWidth="0.6" opacity="0.4" />

      {/* ============================================ */}
      {/* ROOM: KITCHEN (top-right) */}
      {/* ============================================ */}
      <line x1="660" y1="240" x2="870" y2="240" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      {/* Door from kitchen to corridor */}
      <rect x="658" y="160" width="6" height="36" fill="url(#woodGrain)" />

      <text x={R.kitchen.x + 12} y={R.kitchen.y + 18} fontSize="9" fill="hsl(30, 8%, 55%)" fontFamily="Space Grotesk, sans-serif" fontWeight="600" opacity="0.5" letterSpacing="1.5">KITCHEN</text>

      {/* Counter */}
      <rect x="700" y="50" width="150" height="20" rx="3" fill="hsl(200, 5%, 65%)" />
      <rect x="702" y="52" width="146" height="16" rx="2" fill="hsl(200, 5%, 72%)" />
      {/* Sink */}
      <rect x="740" y="55" width="20" height="10" rx="3" fill="hsl(200, 10%, 60%)" />
      {/* Fridge */}
      <rect x="830" y="45" width="28" height="55" rx="3" fill="hsl(200, 5%, 78%)" />
      <rect x="832" y="47" width="24" height="28" rx="2" fill="hsl(200, 5%, 82%)" />
      <rect x="832" y="78" width="24" height="18" rx="2" fill="hsl(200, 5%, 80%)" />
      <circle cx="852" cy="63" r="1.5" fill="hsl(200, 5%, 60%)" />
      {/* Small table */}
      <rect x="710" y="130" width="50" height="40" rx="20" fill="hsl(25, 22%, 50%)" />
      <rect x="713" y="133" width="44" height="34" rx="17" fill="hsl(25, 24%, 56%)" />
      {/* Chairs around kitchen table */}
      <ellipse cx="735" cy="120" rx="8" ry="5" fill="hsl(30, 18%, 42%)" opacity="0.4" />
      <ellipse cx="735" cy="180" rx="8" ry="5" fill="hsl(30, 18%, 42%)" opacity="0.4" />
      <ellipse cx="700" cy="150" rx="5" ry="8" fill="hsl(30, 18%, 42%)" opacity="0.4" />
      <ellipse cx="770" cy="150" rx="5" ry="8" fill="hsl(30, 18%, 42%)" opacity="0.4" />
      {/* Microwave */}
      <rect x="700" y="54" width="18" height="12" rx="1" fill="hsl(0, 0%, 70%)" />
      <rect x="702" y="56" width="12" height="8" rx="0.5" fill="hsl(0, 0%, 20%)" opacity="0.3" />
      {/* Coffee machine */}
      <rect x="770" y="52" width="14" height="16" rx="2" fill="hsl(0, 0%, 35%)" />
      <rect x="772" y="54" width="10" height="6" rx="1" fill="hsl(0, 0%, 25%)" />
      <circle cx="777" cy="64" r="2" fill="hsl(0, 60%, 45%)" opacity="0.6" />

      {/* Potted plant near kitchen wall */}
      <g transform="translate(836, 206)">
        <ellipse cx="0" cy="12" rx="10" ry="3" fill="hsl(30, 12%, 30%)" opacity="0.14" />
        <path d="M-1 4 C-9 -1 -10 -10 -4 -15 C2 -10 4 -2 -1 4Z" fill="hsl(140, 30%, 44%)" />
        <path d="M2 3 C8 0 9 -8 4 -13 C-1 -9 -2 -2 2 3Z" fill="hsl(145, 34%, 40%)" />
        <path d="M-5 4 H5 L4 12 H-4 Z" fill="hsl(24, 28%, 48%)" />
        <rect x="-4" y="4" width="8" height="1.5" rx="0.7" fill="hsl(24, 22%, 58%)" opacity="0.7" />
      </g>

      {/* ============================================ */}
      {/* ROOM: LOUNGE (bottom-center) */}
      {/* ============================================ */}
      <line x1="440" y1="370" x2="440" y2="580" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      <line x1="660" y1="370" x2="660" y2="580" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />

      <text x={R.lounge.x + 12} y={R.lounge.y + 18} fontSize="9" fill="hsl(30, 8%, 55%)" fontFamily="Space Grotesk, sans-serif" fontWeight="600" opacity="0.5" letterSpacing="1.5">LOUNGE</text>

      {/* Rug */}
      <rect x="455" y="400" width="190" height="130" rx="8" fill="url(#loungeRug)" opacity="0.35" />

      {/* Couch */}
      <rect x="465" y="420" width="85" height="35" rx="10" fill="hsl(15, 40%, 48%)" />
      <rect x="469" y="424" width="77" height="27" rx="8" fill="hsl(15, 45%, 55%)" />
      <circle cx="490" cy="437" r="9" fill="hsl(15, 45%, 60%)" opacity="0.4" />
      <circle cx="515" cy="437" r="9" fill="hsl(15, 45%, 60%)" opacity="0.4" />

      {/* Coffee table */}
      <rect x="480" y="465" width="48" height="24" rx="5" fill="hsl(25, 20%, 45%)" />
      <rect x="483" y="468" width="42" height="18" rx="3" fill="hsl(25, 22%, 52%)" />
      <circle cx="504" cy="477" r="3.5" fill="hsl(0, 0%, 92%)" />
      <circle cx="504" cy="477" r="2" fill="hsl(25, 40%, 30%)" />

      {/* Bean bag */}
      <ellipse cx="600" cy="440" rx="20" ry="14" fill="hsl(260, 20%, 52%)" opacity="0.45" />
      <ellipse cx="600" cy="438" rx="16" ry="11" fill="hsl(260, 22%, 58%)" opacity="0.45" />

      {/* TV */}
      <rect x="620" y="395" width="30" height="20" rx="2" fill="hsl(220, 10%, 20%)" />
      <rect x="622" y="397" width="26" height="15" rx="1" fill="hsl(220, 15%, 30%)" opacity="0.6" />

      {/* Potted plant in lounge corner */}
      <g transform="translate(470, 520)">
        <ellipse cx="0" cy="12" rx="11" ry="3.2" fill="hsl(30, 12%, 30%)" opacity="0.14" />
        <path d="M-1 4 C-11 -2 -12 -13 -5 -19 C2 -13 5 -3 -1 4Z" fill="hsl(140, 28%, 43%)" />
        <path d="M2 3 C10 -1 12 -11 5 -17 C-1 -11 -3 -2 2 3Z" fill="hsl(145, 32%, 39%)" />
        <path d="M-3 1 C-5 -8 -1 -16 4 -20 C6 -11 3 -4 -3 1Z" fill="hsl(132, 24%, 46%)" />
        <path d="M-5 4 H5 L4 12 H-4 Z" fill="hsl(24, 28%, 48%)" />
        <rect x="-4" y="4" width="8" height="1.5" rx="0.7" fill="hsl(24, 22%, 58%)" opacity="0.7" />
      </g>

      {/* ============================================ */}
      {/* ROOM: QUIET CORNER (bottom-left) */}
      {/* ============================================ */}
      <line x1="310" y1="370" x2="310" y2="580" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />

      <text x={R.quiet.x + 12} y={R.quiet.y + 18} fontSize="9" fill="hsl(30, 8%, 55%)" fontFamily="Space Grotesk, sans-serif" fontWeight="600" opacity="0.5" letterSpacing="1.5">QUIET CORNER</text>

      {/* Carpet */}
      <rect x="45" y="395" width="240" height="140" rx="8" fill="url(#carpetTexture)" opacity="0.25" />

      {/* Armchairs */}
      <rect x="60" y="410" width="32" height="32" rx="10" fill="hsl(260, 18%, 50%)" opacity="0.45" />
      <rect x="64" y="414" width="24" height="24" rx="8" fill="hsl(260, 20%, 55%)" opacity="0.45" />
      <rect x="170" y="420" width="32" height="32" rx="10" fill="hsl(200, 18%, 50%)" opacity="0.45" />
      <rect x="174" y="424" width="24" height="24" rx="8" fill="hsl(200, 20%, 55%)" opacity="0.45" />

      {/* Small table */}
      <circle cx="130" cy="435" r="12" fill="hsl(25, 20%, 48%)" />
      <circle cx="130" cy="435" r="10" fill="hsl(25, 22%, 55%)" />

      {/* Floor lamp */}
      <rect x="118" y="395" width="3" height="28" fill="hsl(40, 30%, 48%)" />
      <ellipse cx="119.5" cy="392" rx="10" ry="6" fill="hsl(45, 55%, 72%)" opacity="0.4" />
      <circle cx="119.5" cy="392" r="3.5" fill="hsl(45, 80%, 88%)" opacity="0.6" />

      {/* Bookshelf */}
      <rect x="40" y="490" width="60" height="42" rx="2" fill="hsl(25, 20%, 45%)" />
      <rect x="43" y="493" width="54" height="10" rx="1" fill="hsl(25, 22%, 52%)" />
      <rect x="43" y="506" width="54" height="10" rx="1" fill="hsl(25, 22%, 52%)" />
      <rect x="43" y="519" width="54" height="10" rx="1" fill="hsl(25, 22%, 52%)" />
      {[46, 52, 58, 64, 70, 76, 82].map((bx, i) => (
        <rect key={`qb-${i}`} x={bx} y={494} width="4" height={9} rx="0.3" fill={`hsl(${[350, 210, 45, 140, 280, 30, 180][i]}, ${45}%, 55%)`} />
      ))}

      {/* Cat bed */}
      <g transform="translate(240, 500)">
        <ellipse cx="0" cy="0" rx="14" ry="9" fill="hsl(30, 15%, 58%)" opacity="0.35" />
        <ellipse cx="0" cy="-1" rx="6" ry="3.5" fill="hsl(30, 20%, 45%)" opacity="0.3" />
        <circle cx="-4" cy="-3" r="2.5" fill="hsl(30, 20%, 45%)" opacity="0.3" />
      </g>

      {/* ============================================ */}
      {/* ROOM: SERVER ROOM (bottom-right) */}
      {/* ============================================ */}
      <line x1="660" y1="370" x2="660" y2="580" stroke="hsl(35, 15%, 58%)" strokeWidth="4" />
      {/* Door */}
      <rect x="658" y="430" width="6" height="36" fill="url(#woodGrain)" />

      <text x={R.server.x + 8} y={R.server.y + 18} fontSize="9" fill="hsl(30, 8%, 55%)" fontFamily="Space Grotesk, sans-serif" fontWeight="600" opacity="0.5" letterSpacing="1.5">SERVER ROOM</text>

      {/* Server racks */}
      {[700, 740, 780].map((sx) => (
        <g key={`srv-${sx}`}>
          <rect x={sx} y="400" width="25" height="55" rx="2" fill="hsl(220, 8%, 30%)" />
          <rect x={sx + 2} y={402} width="21" height="10" rx="1" fill="hsl(220, 8%, 25%)" />
          <rect x={sx + 2} y={414} width="21" height="10" rx="1" fill="hsl(220, 8%, 25%)" />
          <rect x={sx + 2} y={426} width="21" height="10" rx="1" fill="hsl(220, 8%, 25%)" />
          <rect x={sx + 2} y={438} width="21" height="10" rx="1" fill="hsl(220, 8%, 25%)" />
          {/* Status LEDs */}
          <circle cx={sx + 20} cy={406} r="1.2" fill="hsl(140, 60%, 50%)" opacity="0.8" className="animate-monitor-glow" />
          <circle cx={sx + 20} cy={418} r="1.2" fill="hsl(140, 60%, 50%)" opacity="0.6" className="animate-monitor-glow" />
          <circle cx={sx + 20} cy={430} r="1.2" fill="hsl(45, 70%, 55%)" opacity="0.7" />
        </g>
      ))}

      {/* Monitor station */}
      <rect x="700" y="475" width="40" height="25" rx="2" fill="hsl(25, 22%, 52%)" />
      <rect x="708" y="478" width="24" height="14" rx="1" fill="hsl(220, 15%, 20%)" />
      <rect x="710" y="480" width="20" height="10" rx="0.5" fill="hsl(140, 30%, 25%)" opacity="0.5" className="animate-monitor-glow" />
      {/* Terminal text lines */}
      <line x1="712" y1="483" x2="724" y2="483" stroke="hsl(140, 50%, 45%)" strokeWidth="0.4" opacity="0.5" />
      <line x1="712" y1="486" x2="720" y2="486" stroke="hsl(140, 50%, 45%)" strokeWidth="0.4" opacity="0.4" />

      {/* Cable runs on floor */}
      <path d="M725 455 Q730 460 725 465 Q720 470 725 475" fill="none" stroke="hsl(0, 0%, 40%)" strokeWidth="1" opacity="0.3" />
      <path d="M765 455 Q770 460 765 465 Q760 470 765 475" fill="none" stroke="hsl(0, 0%, 40%)" strokeWidth="1" opacity="0.3" />

      {/* UPS unit */}
      <rect x="820" y="420" width="30" height="40" rx="3" fill="hsl(0, 0%, 25%)" />
      <circle cx="835" cy="435" r="3" fill="hsl(140, 40%, 40%)" opacity="0.5" className="animate-monitor-glow" />
      <rect x="825" y="448" width="20" height="4" rx="1" fill="hsl(0, 0%, 30%)" />

      {/* ============================================ */}
      {/* === AMBIENT DETAILS === */}
      {/* ============================================ */}

      {/* Welcome mat at main entrance */}
      <rect x="345" y="345" width="50" height="15" rx="3" fill="hsl(30, 20%, 55%)" opacity="0.25" />
      <text x="370" y="356" textAnchor="middle" fontSize="4" fill="hsl(30, 15%, 45%)" fontFamily="Space Grotesk, sans-serif" fontWeight="500" opacity="0.4">WELCOME</text>

      {/* Ceiling light pools */}
      {[
        { x: 160, y: 140 }, { x: 540, y: 140 }, { x: 770, y: 140 },
        { x: 160, y: 460 }, { x: 540, y: 460 }, { x: 770, y: 460 },
      ].map((l, i) => (
        <circle key={`ceil-${i}`} cx={l.x} cy={l.y} r="35" fill="hsl(45, 60%, 90%)" opacity="0.05" />
      ))}

      {/* Electrical outlets */}
      <rect x="305" y="180" width="4" height="5" rx="0.5" fill="hsl(0, 0%, 92%)" stroke="hsl(0, 0%, 78%)" strokeWidth="0.4" />
      <rect x="656" y="460" width="4" height="5" rx="0.5" fill="hsl(0, 0%, 92%)" stroke="hsl(0, 0%, 78%)" strokeWidth="0.4" />

      {/* Trash can */}
      <rect x="310" y="330" width="8" height="10" rx="2" fill="hsl(0, 0%, 58%)" opacity="0.4" />
      <ellipse cx="314" cy="330" rx="5" ry="1.5" fill="hsl(0, 0%, 62%)" opacity="0.4" />
    </g>
  );
};

export default OfficeBackground;
