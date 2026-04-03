import { useMessage } from '@/contexts/MessageContext';
import { Platform } from '@/lib/message-builder';

export default function AppHeader() {
  const { message, setPlatform } = useMessage();

  const platforms: { id: Platform; label: string }[] = [
    { id: 'telegram', label: 'TELEGRAM' },
    { id: 'max', label: 'MAX PLATFORM' },
  ];

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
          O
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Omni-Builder
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">
            Message Constructor
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`px-4 py-2 text-xs font-semibold tracking-wider transition-all ${
                message.platform === p.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
