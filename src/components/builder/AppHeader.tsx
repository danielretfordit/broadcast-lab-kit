import { useMessage } from '@/contexts/MessageContext';
import { Platform } from '@/lib/message-builder';

export default function AppHeader() {
  const { message, setPlatform } = useMessage();

  const platforms: { id: Platform; label: string }[] = [
    { id: 'telegram', label: 'TELEGRAM' },
    { id: 'max', label: 'MAX' },
  ];

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
          OB
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-foreground">Omni-Builder</h1>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
            Message Constructor
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-border overflow-hidden shadow-sm">
          {platforms.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatform(p.id)}
              className={`px-5 py-2 text-xs font-semibold tracking-wider transition-all ${
                message.platform === p.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
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
