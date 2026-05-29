export interface HomeItem {
  id: string;
  label: string;
  icon: string;
  desc: string;
  tone: 'primary' | 'secondary';
}

interface Props {
  items: HomeItem[];
  onSelect: (id: string) => void;
}

export function HomeScreen({ items, onSelect }: Props) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <header className="mb-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-secondary block mb-1">Pro Studio</span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-primary-fixed-dim leading-none">
            What do you want to train?
          </h1>
          <p className="text-on-surface-variant mt-3 text-base md:text-lg">Pick a module to start your session.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const accent = item.tone === 'secondary' ? 'text-secondary' : 'text-primary-fixed-dim';
            const glow = item.tone === 'secondary' ? 'rgba(78,222,163,0.18)' : 'rgba(0,218,243,0.18)';
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="surface-card rounded-2xl p-6 text-left relative overflow-hidden active:scale-[0.98] transition-transform"
              >
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl" style={{ background: glow }} />
                <div className="relative z-10 flex flex-col gap-3">
                  <span className={['material-symbols-outlined text-4xl', accent].join(' ')}>{item.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-on-surface">{item.label}</h3>
                    <p className="text-sm text-on-surface-variant mt-1 leading-snug">{item.desc}</p>
                  </div>
                  <span className={['material-symbols-outlined self-end text-xl', accent].join(' ')}>arrow_forward</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
