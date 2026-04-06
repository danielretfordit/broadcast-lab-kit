import { useMessage } from '@/contexts/MessageContext';
import { Platform } from '@/lib/message-builder';

const TELEGRAM_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg';
const MAX_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/0/0a/VK_Max_Logo.svg';

const platforms: { id: Platform; label: string; logo: string }[] = [
  { id: 'telegram', label: 'Telegram', logo: TELEGRAM_LOGO },
  { id: 'max', label: 'MAX', logo: MAX_LOGO },
];

export default function AppHeader() {
  const { message, setPlatform } = useMessage();

  return (
    <header className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm">
          OB
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground">Omni-Builder</h1>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
            Конструктор рассылок
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-border overflow-hidden bg-muted p-0.5">
        {platforms.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
              message.platform === p.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <img src={p.logo} alt={p.label} className="w-4 h-4" />
            {p.label}
          </button>
        ))}
      </div>
    </header>
  );
}
