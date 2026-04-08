import { useMessage } from '@/contexts/MessageContext';
import { Platform } from '@/lib/message-builder';
import { useProjectInfo } from '@/hooks/useProjectInfo';
import { Info, Code2 } from 'lucide-react';
import maxLogo from '@/assets/max-logo.png';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const TELEGRAM_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg';

const platforms: { id: Platform; label: string; logo?: string; icon?: typeof Code2 }[] = [
  { id: 'telegram', label: 'Telegram', logo: TELEGRAM_LOGO },
  { id: 'max', label: 'MAX', logo: maxLogo },
  { id: 'html', label: 'HTML', icon: Code2 },
];

export default function AppHeader() {
  const { message, setPlatform } = useMessage();
  const project = useProjectInfo();

  return (
    <header className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card shadow-sm">
      {/* Left: logo + project info */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-3 flex-shrink-0">
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

        {/* Project info */}
        <div className="h-8 w-px bg-border flex-shrink-0" />
        <div className="min-w-0 flex items-center gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              Проект{' '}
              <span className="text-primary font-bold">ID {project.id}</span>
            </p>
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                {project.name}
              </p>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Info size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Проект <span className="text-primary">ID {project.id}</span>
                </p>
                <p className="text-sm font-medium text-foreground">{project.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{project.description}</p>
                {project.guid && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-2">GUID: {project.guid}</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Right: platform toggle */}
      <div className="flex items-center gap-1.5 rounded-lg border border-border overflow-hidden bg-muted p-0.5 flex-shrink-0">
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
            {p.logo ? (
              <img src={p.logo} alt={p.label} className="w-4 h-4" />
            ) : p.icon ? (
              <p.icon size={14} />
            ) : null}
            {p.label}
          </button>
        ))}
      </div>
    </header>
  );
}
