import { useMessage } from '@/contexts/MessageContext';
import { useEffect } from 'react';
import { Platform , parseJsonToMessage } from '@/lib/message-builder';
import { useProjectInfo } from '@/hooks/useProjectInfo';
import { Info, Code2, Megaphone, Mail, RotateCcw, Lock, Coins } from 'lucide-react';
import maxLogo from '@/assets/max-logo.png';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useSearchParams } from 'react-router-dom';


const TELEGRAM_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg';

type PlatformTab = {
  id: Platform;
  label: string;
  logo?: string;
  icon?: typeof Code2;
  CustomIcon?: React.FC<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
};

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.78 14.43c-.36 2.84-2.46 3.02-2.85 3.14-.16.05-1.66.42-3.55-.84a31.5 31.5 0 0 1-3.27-2.51 18 18 0 0 1-2.42-2.95c-.83-1.27-1.4-2.7-1.43-2.79a3.94 3.94 0 0 1-.05-2.62c.34-.86 1.05-1.16 1.36-1.27.3-.1.59-.06.78.05.27.16.86.86 1.45 1.79.27.43.51.92.4 1.27-.1.34-.43.6-.7.86-.28.27-.45.46-.32.74.12.27.6.99 1.31 1.62.91.81 1.66 1.05 1.94 1.18.27.13.45-.02.65-.27.2-.24.55-.65.85-.85.3-.2.55-.18.84-.07.3.11 1.92.91 2.25 1.07.34.16.56.24.64.38.08.14.08.8-.18 1.57z"/>
      <path d="M12 1.5c-5.8 0-9.46 4.4-9.5 8.78a8.4 8.4 0 0 0 1.32 4.84l-.86 3.16 3.27-.86A9.07 9.07 0 0 0 12 18.78c5.8 0 9.5-4.4 9.5-8.5S17.8 1.5 12 1.5zm5.4 12.66a3.65 3.65 0 0 1-2.66 1.94l-.78.18a13 13 0 0 1-3.36-1c-3.42-1.49-5.5-4.96-5.66-5.18-.16-.22-1.32-1.74-1.32-3.32 0-1.58.83-2.36 1.13-2.68.3-.32.65-.4.86-.4l.62.01c.2.01.46-.07.72.55.27.65.92 2.25.99 2.4.07.16.13.34.02.55-.1.22-.16.35-.31.54-.16.18-.33.4-.47.54-.16.16-.32.32-.14.62.18.3.81 1.34 1.74 2.16 1.2 1.07 2.2 1.4 2.5 1.55.3.16.48.13.66-.07.18-.2.76-.88.96-1.18.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.34.07.13.07.74-.18 1.45-.27.7-1.5 1.4-2.05 1.46-.55.07-.6.11-3.66-1.42-3.6-1.78-5.86-5.55-6.04-5.79-.18-.24-1.43-1.9-1.43-3.62 0-1.71.9-2.55 1.21-2.9.32-.34.7-.43.94-.43.23 0 .45 0 .65.01" fill="none"/>
    </svg>
  );
}

const platforms: PlatformTab[] = [
  { id: 'telegram', label: 'Telegram', logo: TELEGRAM_LOGO },
  { id: 'max', label: 'MAX', logo: maxLogo },
  { id: 'viber', label: 'Viber Business / SMS', CustomIcon: ViberIcon, iconColor: '#7360F2' },
  { id: 'html', label: 'Email', icon: Mail },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.13 1.588 5.931L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function SmsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
    </svg>
  );
}

export default function AppHeader({ builderMode, onBuilderModeChange, lockedMode, lockedChannel }: AppHeaderProps) {
  const { message, setPlatform, resetDraft,setMessage } = useMessage();
  const project = useProjectInfo();
  const [searchParams] = useSearchParams();

  const getHttpJson = async () => {
    const guid = searchParams.get('guid');
    fetch(`/api/getTemplate?guid=${guid}`)
      .then(res => res.json())
      .then(data => {
        const updates = parseJsonToMessage(data.json, message.platform);
        setMessage(prev => ({ ...prev, ...updates }));
      })
  }

  useEffect(() => {
    getHttpJson();
  }, []);

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

          {/* Disabled channels */}
          {([
            { id: 'viber', label: 'Viber', Icon: ViberIcon, paid: false },
            { id: 'viber-business', label: 'Viber Business', Icon: ViberIcon, paid: true },
            { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppIcon, paid: false },
            { id: 'sms', label: 'SMS', Icon: SmsIcon, paid: true },
          ] as const).map(ch => (
            <Tooltip key={ch.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled
                  className="relative flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium bg-muted/40 text-muted-foreground/50 cursor-not-allowed border border-transparent"
                >
                  <ch.Icon className="w-4 h-4" />
                  {ch.label}
                  <Lock size={10} className="ml-0.5" />
                  {ch.paid && <Coins size={10} className="text-amber-500/70" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>Недоступно</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </header>
    </TooltipProvider>
  );
}
