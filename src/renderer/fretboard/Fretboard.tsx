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

export function Fretboard({ minFret = 0, maxFret = 12, markers = [], height = 220, onSelect }: Props) {
  const displayMin = Math.max(0, Math.min(minFret, maxFret));
  const displayMax = Math.max(displayMin + 4, maxFret);
  const fretCount = displayMax - displayMin + 1;

  // Layout
  const padL = 56;
  const padR = 16;
  const padT = 18;
  const padB = 24;
  const innerW = 920;
  const totalW = innerW + padL + padR;
  const innerH = height - padT - padB;
  const fretW = innerW / fretCount;
  const stringGap = innerH / (STRINGS.length - 1);

  const xForFret = (f: number) => padL + (f - displayMin) * fretW + fretW / 2;
  const xForFretLine = (f: number) => padL + (f - displayMin + 1) * fretW; // line to the right of fret
  const yForString = (s: StringIndex) => padT + s * stringGap;

  return (
    <svg viewBox={`0 0 ${totalW} ${height}`} className="w-full">
      {/* Fretboard background */}
      <rect
        x={padL}
        y={padT - 4}
        width={innerW}
        height={innerH + 8}
        rx={4}
        fill="#1a140e"
        stroke="#2a1f15"
      />

      {/* Nut, if visible */}
      {displayMin === 0 && (
        <rect x={padL - 4} y={padT - 6} width={6} height={innerH + 12} fill="#e7d4b5" />
      )}

      {/* Inlays */}
      {Array.from({ length: fretCount }, (_, i) => displayMin + i).map((f) => {
        if (f === 0) return null;
        const cx = xForFret(f);
        const cy = padT + innerH / 2;
        if (DOUBLE_INLAY_FRETS.has(f)) {
          return (
            <g key={`inlay-${f}`} fill="#3a2e22">
              <circle cx={cx} cy={padT + stringGap * 1.2} r={5} />
              <circle cx={cx} cy={padT + stringGap * 3.8} r={5} />
            </g>
          );
        }
        if (INLAY_FRETS.has(f)) {
          return <circle key={`inlay-${f}`} cx={cx} cy={cy} r={5} fill="#3a2e22" />;
        }
        return null;
      })}

      {/* Fret lines */}
      {Array.from({ length: fretCount + 1 }, (_, i) => displayMin + i - 1).map((f) => {
        const x = padL + (f - displayMin + 1) * fretW;
        return (
          <line
            key={`fret-${f}`}
            x1={x}
            y1={padT - 4}
            x2={x}
            y2={padT + innerH + 4}
            stroke="#5e4a32"
            strokeWidth={f === -1 ? 0 : 1.5}
          />
        );
      })}

      {/* Strings */}
      {STRINGS.map((s) => {
        const thickness = 1 + s * 0.4;
        return (
          <line
            key={`s-${s}`}
            x1={padL - 2}
            y1={yForString(s)}
            x2={padL + innerW}
            y2={yForString(s)}
            stroke="#c8b591"
            strokeWidth={thickness}
          />
        );
      })}

      {/* String labels */}
      {STRINGS.map((s) => (
        <text
          key={`sl-${s}`}
          x={padL - 14}
          y={yForString(s) + 4}
          textAnchor="end"
          fontSize={12}
          fill="#a3a3a3"
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
          y={padT + innerH + 16}
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
        const cx = m.position.fret === 0 ? padL - 14 : xForFret(m.position.fret);
        const cy = yForString(m.position.string);
        const label = m.label ?? midiToPitchClass(fretToMidi(m.position.string, m.position.fret));
        return (
          <g key={`m-${i}`}>
            <circle cx={cx} cy={cy} r={14} fill={m.color} stroke="#0b0d10" strokeWidth={2} />
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
