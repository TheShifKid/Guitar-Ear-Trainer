import { useSettings } from '@renderer/store/settingsStore';
import { INTERVALS } from '@renderer/music/intervals';
import { CHORDS } from '@renderer/music/chords';
import { STRING_LABELS, midiToNoteName } from '@renderer/music/tuning';
import type { StringIndex } from '@shared/types';

// Strings shown low→high (6th E … 1st e) like a real fretboard chart.
const STRING_ORDER: { idx: StringIndex; label: string; ord: string }[] = [
  { idx: 5, label: 'E', ord: '6th' },
  { idx: 4, label: 'A', ord: '5th' },
  { idx: 3, label: 'D', ord: '4th' },
  { idx: 2, label: 'G', ord: '3rd' },
  { idx: 1, label: 'B', ord: '2nd' },
  { idx: 0, label: 'e', ord: '1st' },
];

export function SettingsScreen() {
  const s = useSettings();

  return (
    <div className="h-full overflow-y-auto">
      {/* Header bar */}
      <header className="flex justify-between items-center px-4 md:px-8 py-6 md:py-8 sticky top-0 z-10 bg-surface-container-low border-b border-outline-variant/30">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-primary-fixed-dim">Gear Setup</h2>
          <p className="text-on-surface-variant">Calibrate your practice session</p>
        </div>
        <div className="flex gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined">settings</span>
          <span className="material-symbols-outlined">person</span>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left column ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Fret Range */}
            <Card>
              <CardHead title="Fret Range" sub="Define training boundaries"
                badge={`${s.fretMin} – ${s.fretMax}`} />
              <div className="fretboard-wood relative h-28 w-full rounded-lg mt-6 mb-6 border border-outline-variant/30 overflow-hidden">
                <div className="absolute inset-0 flex justify-around px-3 pointer-events-none">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-[2px] h-full bg-gradient-to-b from-outline-variant via-outline to-outline-variant opacity-40" />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col justify-around py-3 pointer-events-none">
                  {[1, 1.5, 2, 2.5, 3, 3.5].map((h, i) => (
                    <div key={i} className="bg-outline-variant/70 w-full" style={{ height: h }} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <LabeledSlider label="Min fret" value={s.fretMin} min={0} max={24}
                  onChange={(v) => s.setFretRange(v, s.fretMax)} />
                <LabeledSlider label="Max fret" value={s.fretMax} min={0} max={24}
                  onChange={(v) => s.setFretRange(s.fretMin, v)} />
              </div>
            </Card>

            {/* Active Strings */}
            <Card>
              <CardHead title="Active Strings" sub="Target specific tonal regions" />
              <div className="grid grid-cols-6 gap-2 mt-4">
                {STRING_ORDER.map(({ idx, label, ord }) => {
                  const on = s.enabledStrings.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => s.toggleString(idx)}
                      className={[
                        'flex flex-col items-center justify-center py-5 rounded-lg border transition-all active:scale-95',
                        on ? 'border-secondary bg-secondary/5 text-secondary' : 'border-outline-variant/30 text-on-surface hover:text-secondary',
                      ].join(' ')}
                    >
                      <span className="text-3xl font-bold leading-none">{label}</span>
                      <span className="font-mono text-[10px] opacity-50 mt-1">{ord}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Interval Pool */}
            <Card>
              <CardHead title="Interval Pool" sub="Select intervals for the session"
                action={<button onClick={() => s.setIntervals(INTERVALS.map((i) => i.id))}
                  className="font-mono text-[11px] uppercase tracking-wider text-primary bg-primary/10 px-4 py-2 rounded">Select All</button>} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {INTERVALS.map((i) => {
                  const on = s.enabledIntervals.includes(i.id);
                  const locked = s.mode === 'progressive';
                  return (
                    <button
                      key={i.id}
                      onClick={() => !locked && s.toggleInterval(i.id)}
                      disabled={locked}
                      className={[
                        'py-4 px-4 bg-surface-container-high rounded border border-outline-variant/20 flex items-center justify-between active:scale-95 transition-all',
                        locked ? 'opacity-50 cursor-not-allowed' : '',
                        on ? '' : 'opacity-40',
                      ].join(' ')}
                    >
                      <span className={['font-mono text-xs', on ? 'text-secondary' : 'text-on-surface'].join(' ')}>{i.short}</span>
                      <span className={['w-2 h-2 rounded-full', on ? 'bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]' : 'bg-outline-variant'].join(' ')} />
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Chords (extra — Chord mode) */}
            <Card>
              <CardHead title="Chord Pool" sub="For Chords & Progressions modes" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {CHORDS.map((c) => {
                  const on = s.enabledChords.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => s.toggleChord(c.id)}
                      className={['py-4 px-4 bg-surface-container-high rounded border border-outline-variant/20 flex items-center justify-between active:scale-95 transition-all', on ? '' : 'opacity-40'].join(' ')}
                    >
                      <span className={['font-mono text-xs', on ? 'text-secondary' : 'text-on-surface'].join(' ')}>{c.short}</span>
                      <span className={['w-2 h-2 rounded-full', on ? 'bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]' : 'bg-outline-variant'].join(' ')} />
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Engine Calibration */}
            <Card className="relative overflow-hidden">
              <span className="material-symbols-outlined absolute top-4 right-4 text-[120px] opacity-10 pointer-events-none">graphic_eq</span>
              <CardHead title="Engine Calibration" sub="Precise timing adjustments" />
              <div className="space-y-6 mt-6">
                <ValueSlider label="Note Duration" value={s.noteDurationMs} unit="ms" min={300} max={3000} step={100}
                  lo="300ms" hi="3000ms" onChange={(v) => s.setNoteDuration(v)} />
                <ValueSlider label="Gap Min" value={s.gapMinMs} unit="ms" min={50} max={3000} step={50}
                  lo="50ms" hi="3000ms" onChange={(v) => s.setGapRange(v, s.gapMaxMs)} />
                <ValueSlider label="Gap Max" value={s.gapMaxMs} unit="ms" min={50} max={3000} step={50}
                  lo="50ms" hi="3000ms" onChange={(v) => s.setGapRange(s.gapMinMs, v)} />
              </div>
            </Card>

            {/* Advanced switches */}
            <Card className="space-y-4">
              <SwitchRow icon="bolt" iconTone="secondary" title="Progressive Unlock" sub="Difficulty adapts to your score"
                checked={s.mode === 'progressive'} onChange={(v) => s.setMode(v ? 'progressive' : 'comfortable')} />
              <SwitchRow icon="south" iconTone="primary" title="Descending Intervals" sub="Second note can fall below the root"
                checked={s.allowDescending} onChange={s.setAllowDescending} />
              <SwitchRow icon="visibility" iconTone="primary" title="Show Notes Early" sub="Reveal both positions while guessing"
                checked={s.showNotesBeforeAnswer} onChange={s.setShowNotesBeforeAnswer} />
              <SwitchRow icon="music_note" iconTone="secondary" title="Reference Tone" sub={`Anchor pitch (${midiToNoteName(s.referencePitch)}) before each question`}
                checked={s.enableReferenceTone} onChange={s.setEnableReferenceTone} />
            </Card>

            {/* Playback + sound */}
            <Card>
              <CardHead title="Audio" sub="Playback engine" />
              <div className="flex gap-2 mt-4">
                {(['melodic', 'harmonic'] as const).map((m) => (
                  <button key={m} onClick={() => s.setPlaybackMode(m)}
                    className={['flex-1 py-3 rounded-lg border-2 text-sm capitalize transition', s.playbackMode === m ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30 text-on-surface-variant'].join(' ')}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                {(['acoustic', 'electric'] as const).map((p) => (
                  <button key={p} onClick={() => s.setSoundPack(p)}
                    className={['flex-1 py-3 rounded-lg border-2 text-sm capitalize transition', s.soundPack === p ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30 text-on-surface-variant'].join(' ')}>
                    {p}
                  </button>
                ))}
              </div>
            </Card>

            {/* Goals + melody */}
            <Card className="space-y-4">
              <ValueSlider label="Daily Goal" value={s.dailyGoalReps} unit="reps" min={10} max={300} step={10}
                lo="10" hi="300" onChange={(v) => s.setDailyGoalReps(v)} />
              <ValueSlider label="Melody Length" value={s.melodyLength} unit="notes" min={3} max={6} step={1}
                lo="3" hi="6" onChange={(v) => s.setMelodyLength(v)} />
            </Card>

            {/* Studio engine card */}
            <div className="rounded-xl overflow-hidden h-36 relative border border-outline-variant/20 bg-gradient-to-br from-surface-container-high to-surface-container-lowest">
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[140px] text-primary-fixed-dim/10">graphic_eq</span>
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className="font-mono text-[11px] tracking-widest uppercase text-primary">Analog Quality</p>
                <h4 className="text-2xl font-semibold leading-none">Studio Engine V2.4</h4>
              </div>
            </div>

            {/* Reset / Save */}
            <div className="flex gap-4">
              <button onClick={() => { if (confirm('Reset all settings to defaults?')) s.resetToDefaults(); }}
                className="milled-button flex-1 py-4 border border-outline text-on-surface-variant rounded-lg font-semibold">
                Reset Defaults
              </button>
              <button onClick={() => {}}
                className="milled-button active-glow flex-1 py-4 bg-primary text-on-primary rounded-lg font-semibold">
                Save Patch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-card rounded-xl p-6 ${className}`}>{children}</section>;
}

function CardHead({ title, sub, badge, action }: { title: string; sub: string; badge?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-2xl font-semibold text-primary">{title}</h3>
        <p className="font-mono text-[11px] uppercase tracking-wider text-outline">{sub}</p>
      </div>
      {badge && <span className="font-mono text-[11px] text-primary px-4 py-1 bg-primary/10 rounded-full">{badge}</span>}
      {action}
    </div>
  );
}

function LabeledSlider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-on-surface flex justify-between"><span>{label}</span><span className="font-mono text-secondary">{value}</span></span>
      <input type="range" value={value} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}

function ValueSlider({ label, value, unit, min, max, step = 1, lo, hi, onChange }: {
  label: string; value: number; unit: string; min: number; max: number; step?: number; lo: string; hi: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-on-surface">{label}</label>
        <span className="font-mono text-secondary text-sm">{value} {unit}</span>
      </div>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
      <div className="flex justify-between font-mono text-[10px] text-outline"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}

function SwitchRow({ icon, iconTone, title, sub, checked, onChange }: {
  icon: string; iconTone: 'secondary' | 'primary'; title: string; sub: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-lg transition-all hover:bg-surface-container-highest">
      <div className="flex items-center gap-4">
        <div className={['p-2 rounded', iconTone === 'secondary' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'].join(' ')}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="font-bold text-on-surface">{title}</p>
          <p className="text-xs text-outline">{sub}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={['w-12 h-6 rounded-full p-1 flex items-center transition-colors', checked ? 'bg-secondary justify-end' : 'bg-surface-variant justify-start'].join(' ')}
      >
        <div className={['w-4 h-4 rounded-full shadow-sm', checked ? 'bg-on-secondary' : 'bg-on-surface-variant'].join(' ')} />
      </button>
    </div>
  );
}
