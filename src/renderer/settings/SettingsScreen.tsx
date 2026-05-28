import { useSettings } from '@renderer/store/settingsStore';
import { INTERVALS } from '@renderer/music/intervals';
import { ALL_STRINGS, STRING_LABELS } from '@renderer/music/tuning';
import type { StringIndex } from '@shared/types';

export function SettingsScreen() {
  const s = useSettings();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Settings</h1>

        {/* ── Mode ── */}
        <Section label="Training Mode">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'comfortable', title: 'Comfortable', desc: 'Drill intervals you already know' },
                { id: 'progressive', title: 'Progressive', desc: 'Unlock intervals as you hit 85% accuracy' },
                { id: 'custom', title: 'Custom', desc: 'Pick exactly which intervals to drill' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => s.setMode(m.id)}
                className={[
                  'flex flex-col items-start p-4 rounded-xl border-2 text-left transition',
                  s.mode === m.id
                    ? 'border-accent bg-accent/10 text-slate-100'
                    : 'border-ink-600 bg-ink-700 text-slate-400 hover:border-ink-500 hover:text-slate-300',
                ].join(' ')}
              >
                <span className={['font-semibold text-sm', s.mode === m.id ? 'text-accent' : ''].join(' ')}>
                  {m.title}
                </span>
                <span className="text-xs mt-0.5 leading-snug">{m.desc}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ── Intervals ── */}
        <Section label="Intervals">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {INTERVALS.map((i) => {
              const on = s.enabledIntervals.includes(i.id);
              const locked = s.mode === 'progressive';
              return (
                <button
                  key={i.id}
                  onClick={() => !locked && s.toggleInterval(i.id)}
                  disabled={locked}
                  className={[
                    'flex flex-col items-start p-3 rounded-xl border-2 transition text-left',
                    locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    on
                      ? 'border-accent bg-accent/10'
                      : 'border-ink-600 bg-ink-700 hover:border-ink-500',
                  ].join(' ')}
                >
                  <span className={['font-mono font-bold text-base', on ? 'text-accent' : 'text-slate-300'].join(' ')}>
                    {i.short}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-tight mt-0.5">{i.name}</span>
                  <span className="text-[10px] text-slate-600 mt-1">{i.semitones} st</span>
                </button>
              );
            })}
          </div>
          {s.mode === 'progressive' && (
            <p className="text-xs text-slate-500 mt-2">
              Intervals unlock automatically as your accuracy crosses 85% on the last 20 reps.
            </p>
          )}
        </Section>

        {/* ── Fret range ── */}
        <Section label="Fret Range">
          <div className="space-y-4">
            <SliderField
              label={`Min fret — ${s.fretMin}`}
              value={s.fretMin}
              min={0}
              max={24}
              onChange={(v) => s.setFretRange(v, s.fretMax)}
            />
            <SliderField
              label={`Max fret — ${s.fretMax}`}
              value={s.fretMax}
              min={0}
              max={24}
              onChange={(v) => s.setFretRange(s.fretMin, v)}
            />
          </div>
        </Section>

        {/* ── Strings ── */}
        <Section label="Strings">
          <div className="flex gap-2 flex-wrap">
            {ALL_STRINGS.map((idx) => {
              const on = s.enabledStrings.includes(idx);
              const label = STRING_LABELS[idx as StringIndex];
              const num = 6 - idx;
              return (
                <button
                  key={idx}
                  onClick={() => s.toggleString(idx)}
                  className={[
                    'w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition',
                    on
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-ink-600 bg-ink-700 text-slate-400 hover:border-ink-500',
                  ].join(' ')}
                >
                  <span className="font-mono font-bold text-base">{label}</span>
                  <span className="text-[10px] text-slate-500">{num}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-600 mt-2">String 6 = low E, string 1 = high E</p>
        </Section>

        {/* ── Timing ── */}
        <Section label="Timing">
          <div className="space-y-4">
            <SliderField
              label={`Note duration — ${s.noteDurationMs} ms`}
              value={s.noteDurationMs}
              min={300}
              max={3000}
              step={100}
              onChange={(v) => s.setNoteDuration(v)}
            />
            <SliderField
              label={`Gap min — ${s.gapMinMs} ms`}
              value={s.gapMinMs}
              min={50}
              max={3000}
              step={50}
              onChange={(v) => s.setGapRange(v, s.gapMaxMs)}
            />
            <SliderField
              label={`Gap max — ${s.gapMaxMs} ms`}
              value={s.gapMaxMs}
              min={50}
              max={3000}
              step={50}
              onChange={(v) => s.setGapRange(s.gapMinMs, v)}
            />
          </div>
        </Section>

        {/* ── Sound ── */}
        <Section label="Sound">
          <div className="flex gap-2 items-center">
            {(['acoustic', 'electric'] as const).map((p) => (
              <button
                key={p}
                onClick={() => s.setSoundPack(p)}
                className={[
                  'px-4 py-2 rounded-lg border-2 text-sm font-medium capitalize transition',
                  s.soundPack === p
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-ink-600 bg-ink-700 text-slate-400 hover:border-ink-500',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <ToggleField
              label="Allow descending intervals"
              sub="Second note can be below the root"
              checked={s.allowDescending}
              onChange={s.setAllowDescending}
            />
          </div>
        </Section>

        {/* ── Reset ── */}
        <div className="pt-2 border-t border-ink-700">
          <button
            onClick={() => {
              if (confirm('Reset all settings to defaults?')) s.resetToDefaults();
            }}
            className="text-xs text-slate-500 hover:text-bad transition"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">{label}</h2>
      {children}
    </section>
  );
}

function SliderField({
  label, value, min, max, step = 1, onChange,
}: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs text-slate-400 font-mono">{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-400 h-1 rounded-full bg-ink-600 appearance-none cursor-pointer"
      />
    </label>
  );
}

function ToggleField({
  label, sub, checked, onChange,
}: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left group"
    >
      <div
        className={[
          'w-10 h-5 rounded-full border-2 flex-shrink-0 relative transition-colors',
          checked ? 'bg-accent border-accent' : 'bg-ink-700 border-ink-600',
        ].join(' ')}
      >
        <div
          className={[
            'absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          ].join(' ')}
        />
      </div>
      <div>
        <div className="text-sm text-slate-300 group-hover:text-slate-100 transition">{label}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
    </button>
  );
}
