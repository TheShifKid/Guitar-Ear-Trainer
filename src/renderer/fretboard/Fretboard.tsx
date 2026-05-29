import { useId } from 'react';
import { STRING_LABELS, fretToMidi, midiToPitchClass } from '@renderer/music/tuning';
import { makePosition } from '@renderer/music/fretboard';
import type { FretPosition, StringIndex } from '@shared/types';

interface Marker {
  position: FretPosition;
  color: string;
  label?: string;
}

interface Props {
  minFret?: number;
  maxFret?: number;
  markers?: Marker[];
  height?: number;
  onSelect?: (pos: FretPosition) => void;
}

const STRINGS: StringIndex[] = [0, 1, 2, 3, 4, 5]; // 0 = high E on top
const INLAY_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_INLAY_FRETS = new Set([12, 24]);

export function Fretboard({ minFret = 0, maxFret = 12, markers = [], height = 240, onSelect }: Props) {
  const uid = useId().replace(/:/g, '');
  const woodId = `wood-${uid}`;
  const woodEdgeId = `woodEdge-${uid}`;
  const fretId = `fret-${uid}`;
  const stringId = `string-${uid}`;
  const nutId = `nut-${uid}`;
  const glowId = `glow-${uid}`;
  const markerHaloId = `halo-${uid}`;

  const displayMin = Math.max(0, Math.min(minFret, maxFret));
  const displayMax = Math.max(displayMin + 4, maxFret);
  const fretCount = displayMax - displayMin + 1;

  // Layout
  const padL = 56;
  const padR = 16;
  const padT = 22;
  const padB = 26;
  const innerW = 920;
  const totalW = innerW + padL + padR;
  const innerH = height - padT - padB;
  const fretW = innerW / fretCount;
  const stringGap = innerH / (STRINGS.length - 1);

  const xForFret = (f: number) => padL + (f - displayMin) * fretW + fretW / 2;
  const yForString = (s: StringIndex) => padT + s * stringGap;

  return (
    <svg viewBox={`0 0 ${totalW} ${height}`} className="w-full">
      <defs>
        {/* Rosewood vertical gradient */}
        <linearGradient id={woodId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a281a" />
          <stop offset="18%" stopColor="#4a3220" />
          <stop offset="50%" stopColor="#2e1d11" />
          <stop offset="82%" stopColor="#46301f" />
          <stop offset="100%" stopColor="#241509" />
        </linearGradient>
        {/* Subtle horizontal sheen overlay */}
        <linearGradient id={woodEdgeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
          <stop offset="8%" stopColor="#000000" stopOpacity="0" />
          <stop offset="92%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </linearGradient>
        {/* Metallic fret wire */}
        <linearGradient id={fretId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6b7176" />
          <stop offset="35%" stopColor="#d7dde1" />
          <stop offset="50%" stopColor="#f4f7f9" />
          <stop offset="65%" stopColor="#cdd3d7" />
          <stop offset="100%" stopColor="#5a6166" />
        </linearGradient>
        {/* String metal */}
        <linearGradient id={stringId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0e6cf" />
          <stop offset="50%" stopColor="#c8b591" />
          <stop offset="100%" stopColor="#8c7a59" />
        </linearGradient>
        {/* Bone nut */}
        <linearGradient id={nutId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cdb78f" />
          <stop offset="50%" stopColor="#f3e6c8" />
          <stop offset="100%" stopColor="#b9a274" />
        </linearGradient>
        {/* Marker glow */}
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={markerHaloId}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Fretboard background */}
      <rect
        x={padL}
        y={padT - 6}
        width={innerW}
        height={innerH + 12}
        rx={6}
        fill={`url(#${woodId})`}
        stroke="#15100a"
        strokeWidth={1.5}
      />
      <rect
        x={padL}
        y={padT - 6}
        width={innerW}
        height={innerH + 12}
        rx={6}
        fill={`url(#${woodEdgeId})`}
      />

      {/* Nut, if visible */}
      {displayMin === 0 && (
        <rect x={padL - 5} y={padT - 8} width={7} height={innerH + 16} rx={1.5} fill={`url(#${nutId})`} />
      )}

      {/* Inlays */}
      {Array.from({ length: fretCount }, (_, i) => displayMin + i).map((f) => {
        if (f === 0) return null;
        const cx = xForFret(f);
        const cy = padT + innerH / 2;
        if (DOUBLE_INLAY_FRETS.has(f)) {
          return (
            <g key={`inlay-${f}`}>
              <circle cx={cx} cy={padT + stringGap * 1.2} r={6} fill="#dde3df" opacity={0.85} />
              <circle cx={cx} cy={padT + stringGap * 3.8} r={6} fill="#dde3df" opacity={0.85} />
            </g>
          );
        }
        if (INLAY_FRETS.has(f)) {
          return <circle key={`inlay-${f}`} cx={cx} cy={cy} r={6} fill="#dde3df" opacity={0.85} />;
        }
        return null;
      })}

      {/* Fret lines (metallic wire with shadow) */}
      {Array.from({ length: fretCount + 1 }, (_, i) => displayMin + i - 1).map((f) => {
        if (f === -1) return null;
        const x = padL + (f - displayMin + 1) * fretW;
        return (
          <g key={`fret-${f}`}>
            <line x1={x + 1} y1={padT - 6} x2={x + 1} y2={padT + innerH + 6} stroke="#000000" strokeOpacity={0.4} strokeWidth={2.5} />
            <line x1={x} y1={padT - 6} x2={x} y2={padT + innerH + 6} stroke={`url(#${fretId})`} strokeWidth={2.5} />
          </g>
        );
      })}

      {/* Strings */}
      {STRINGS.map((s) => {
        const thickness = 1 + s * 0.5;
        return (
          <g key={`s-${s}`}>
            <line x1={padL - 2} y1={yForString(s) + 1} x2={padL + innerW} y2={yForString(s) + 1} stroke="#000000" strokeOpacity={0.35} strokeWidth={thickness} />
            <line x1={padL - 2} y1={yForString(s)} x2={padL + innerW} y2={yForString(s)} stroke={`url(#${stringId})`} strokeWidth={thickness} />
          </g>
        );
      })}

      {/* String labels */}
      {STRINGS.map((s) => (
        <text
          key={`sl-${s}`}
          x={padL - 16}
          y={yForString(s) + 4}
          textAnchor="end"
          fontSize={12}
          fill="#7a8290"
          fontFamily="monospace"
        >
          {STRING_LABELS[s]}
        </text>
      ))}

      {/* Fret numbers */}
      {Array.from({ length: fretCount }, (_, i) => displayMin + i).map((f) => (
        <text
          key={`fn-${f}`}
          x={xForFret(f)}
          y={padT + innerH + 18}
          textAnchor="middle"
          fontSize={10}
          fill="#7a8290"
          fontFamily="monospace"
        >
          {f}
        </text>
      ))}

      {/* Markers */}
      {markers.map((m, i) => {
        const cx = m.position.fret === 0 ? padL - 16 : xForFret(m.position.fret);
        const cy = yForString(m.position.string);
        const label = m.label ?? midiToPitchClass(fretToMidi(m.position.string, m.position.fret));
        return (
          <g key={`m-${i}`} filter={`url(#${glowId})`}>
            <circle cx={cx} cy={cy} r={20} fill={m.color} opacity={0.28} />
            <circle cx={cx} cy={cy} r={14} fill={m.color} stroke="#0b0d10" strokeWidth={2} />
            <circle cx={cx - 4} cy={cy - 4} r={9} fill={`url(#${markerHaloId})`} />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="#0b0d10"
              fontFamily="monospace"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Clickable cells (interactive mode) */}
      {onSelect &&
        Array.from({ length: fretCount }, (_, i) => displayMin + i).flatMap((f) =>
          STRINGS.map((s) => (
            <rect
              key={`cell-${s}-${f}`}
              x={padL + (f - displayMin) * fretW}
              y={yForString(s) - stringGap / 2}
              width={fretW}
              height={stringGap}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(makePosition(s, f))}
            />
          )),
        )}
    </svg>
  );
}
