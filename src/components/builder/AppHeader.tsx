import { useMessage } from '@/contexts/MessageContext';
import { Platform } from '@/lib/message-builder';
import { useProjectInfo } from '@/hooks/useProjectInfo';
import { Info, Code2, Megaphone, Mail, RotateCcw, Lock } from 'lucide-react';
import maxLogo from '@/assets/max-logo.png';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

const TELEGRAM_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg';

const platforms: { id: Platform; label: string; logo?: string; icon?: typeof Code2 }[] = [
  { id: 'telegram', label: 'Telegram', logo: TELEGRAM_LOGO },
  { id: 'max', label: 'MAX', logo: maxLogo },
  { id: 'html', label: 'Email', icon: Mail },
];

type BuilderMode = 'marketing' | 'transactional';

interface AppHeaderProps {
  builderMode: BuilderMode;
  onBuilderModeChange: (mode: BuilderMode) => void;
  lockedMode?: BuilderMode | null;
  lockedChannel?: Platform | null;
}

export default function AppHeader({ builderMode, onBuilderModeChange, lockedMode, lockedChannel }: AppHeaderProps) {
  const { message, setPlatform, resetDraft } = useMessage();
  const project = useProjectInfo();

  const handleHardReset = () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('omni-builder-draft'))
        .forEach(k => localStorage.removeItem(k));
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('bot-settings:'))
        .forEach(k => sessionStorage.removeItem(k));
    } catch {}
    window.location.reload();
  };

  return (
    <TooltipProvider delayDuration={200}>
    <header className="border-b border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-4 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleHardReset}
                className="flex items-center gap-3 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
                aria-label="Сбросить кэш и перезагрузить"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm">
                  CA
                </div>
                <div className="text-left">
                  <h1 className="text-sm font-bold tracking-tight text-foreground">CRM Ads</h1>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
                    Конструктор рассылок
                  </p>
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent>Сбросить кэш и перезагрузить</TooltipContent>
          </Tooltip>

          <div className="h-8 w-px bg-border flex-shrink-0" />
          <div className="min-w-0 flex items-center gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                Проект <span className="text-primary font-bold">ID {project.id}</span>
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

        {/* Right: mode toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={resetDraft}
                className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                aria-label="Сбросить шаблон"
              >
                <RotateCcw size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Сбросить черновик текущего канала</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1 rounded-lg border border-border overflow-hidden bg-muted p-0.5">
            {(['marketing', 'transactional'] as BuilderMode[]).map(mode => {
              const isActive = builderMode === mode;
              const isLocked = !!lockedMode && lockedMode !== mode;
              const Icon = mode === 'marketing' ? Megaphone : Mail;
              const label = mode === 'marketing' ? 'Маркетинговые' : 'Транзакционные';
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => !isLocked && onBuilderModeChange(mode)}
                  disabled={isLocked}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-card text-foreground shadow-sm'
                      : isLocked
                        ? 'text-muted-foreground/40 cursor-not-allowed'
                        : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isLocked ? <Lock size={12} /> : <Icon size={14} />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platform sub-tabs — only for marketing */}
      {builderMode === 'marketing' && (
        <div className="flex items-center gap-1 px-5 py-1.5 border-t border-border/50 bg-muted/30">
          {platforms.map(p => {
            const isActive = message.platform === p.id;
            const isLocked = !!lockedChannel && lockedChannel !== p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => !isLocked && setPlatform(p.id)}
                disabled={isLocked}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/25 shadow-sm'
                    : isLocked
                      ? 'text-muted-foreground/40 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {isLocked ? (
                  <Lock size={12} />
                ) : p.logo ? (
                  <img src={p.logo} alt={p.label} className="w-4 h-4" />
                ) : p.icon ? (
                  <p.icon size={14} />
                ) : null}
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
    </TooltipProvider>
  );
}
