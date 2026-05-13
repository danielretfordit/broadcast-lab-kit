import { useMessage } from '@/contexts/MessageContext';
import { useEffect } from 'react';
import { Platform , parseJsonToMessage } from '@/lib/message-builder';
import { useProjectInfo } from '@/hooks/useProjectInfo';
import { Info, Code2, Megaphone, Mail, RotateCcw, Lock, Coins, Clock } from 'lucide-react';
import maxLogo from '@/assets/max-logo.png';
import ViberBrandIcon from '@/components/icons/ViberBrandIcon';
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
  iconClassName?: string;
  paid?: boolean;
  dialog24h?: boolean;
};

// ViberBrandIcon now imported from shared component

function ViberBusinessIcon({ className }: { className?: string }) {
  // Chat-bubble with dots — Viber Business / SMS hybrid channel
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M4.68015 14.1433C4.27146 12.401 4.27146 10.5878 4.68015 8.84544C5.21759 6.55423 7.00659 4.76524 9.29781 4.2278C11.0401 3.81911 12.8533 3.81911 14.5957 4.2278C16.8869 4.76524 18.6759 6.55423 19.2133 8.84544C19.622 10.5878 19.622 12.401 19.2133 14.1433C18.6759 16.4345 16.8869 18.2235 14.5957 18.7609C13.4799 19.0226 12.3275 19.1031 11.1969 19.0024L7.93146 21.0489C7.16336 21.5293 6.16574 20.9128 6.27306 20.0124L6.61117 17.1758C5.6328 16.4276 4.96693 15.3554 4.68015 14.1433ZM8.36173 9.79516C8.36173 9.38095 8.69752 9.04516 9.11173 9.04516H12.1676C12.5818 9.04516 12.9176 9.38095 12.9176 9.79516C12.9176 10.2094 12.5818 10.5452 12.1676 10.5452H9.11173C8.69752 10.5452 8.36173 10.2094 8.36173 9.79516ZM10.1304 12.101C9.71614 12.101 9.38035 12.4368 9.38035 12.851C9.38035 13.2652 9.71614 13.601 10.1304 13.601H15.2235C15.6377 13.601 15.9735 13.2652 15.9735 12.851C15.9735 12.4368 15.6377 12.101 15.2235 12.101H10.1304Z"
      />
    </svg>
  );
}

const platforms: PlatformTab[] = [
  { id: 'telegram', label: 'Telegram', logo: TELEGRAM_LOGO },
  { id: 'max', label: 'MAX', logo: maxLogo },
  { id: 'viber_business', label: 'Viber Business / SMS', CustomIcon: ViberBusinessIcon, iconColor: '#7360F2', iconClassName: 'w-5 h-5', paid: true },
  { id: 'sms', label: 'SMS', CustomIcon: SmsIcon, iconColor: '#6B7280', iconClassName: 'w-5 h-5', paid: true },
  { id: 'viber_bot', label: 'Viber', CustomIcon: ViberBrandIcon, iconColor: '#7360F2', iconClassName: 'w-5 h-5', dialog24h: true },
  { id: 'whatsapp', label: 'WhatsApp', CustomIcon: WhatsAppIcon, iconColor: '#25D366', iconClassName: 'w-5 h-5', dialog24h: true },
  { id: 'html', label: 'Email', icon: Mail },
];

type BuilderMode = 'marketing' | 'transactional';

interface AppHeaderProps {
  builderMode: BuilderMode;
  onBuilderModeChange: (mode: BuilderMode) => void;
  lockedMode?: BuilderMode | null;
  lockedChannel?: Platform | null;
}

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
    if (!guid || guid === 'null') return;
    try {
      const res = await fetch(`/api/getTemplate?guid=${guid}`);
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (!data || !data.json) return;
      const updates = parseJsonToMessage(data.json, message.platform);
      setMessage(prev => ({ ...prev, ...updates }));
    } catch (e) {
      console.warn('getTemplate failed:', e);
    }
  };

  useEffect(() => {
    getHttpJson().catch(() => {});
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
                ) : p.CustomIcon ? (
                  <span style={p.iconColor ? { color: p.iconColor } : undefined}>
                    <p.CustomIcon className={p.iconClassName ?? 'w-4 h-4'} />
                  </span>
                ) : p.icon ? (
                  <p.icon size={14} />
                ) : null}
                {p.label}
                {p.paid && !isLocked && <Coins size={10} className="text-amber-500/80 ml-0.5" />}
                {p.dialog24h && !isLocked && (
                  <span
                    title="Окно 24 часа: можно писать только в течение 24 ч после последнего сообщения пользователя"
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 text-[9px] font-bold leading-none ml-0.5"
                  >
                    <Clock size={9} /> 24h
                  </span>
                )}
              </button>
            );
          })}

          {/* Disabled channels with 24h dialog window */}
          {([
            { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppIcon },
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
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 text-[9px] font-bold leading-none">
                    <Clock size={9} /> 24h
                  </span>
                  <Lock size={10} className="ml-0.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Окно 24 часа: можно писать только в течение 24 ч после последнего сообщения пользователя. Канал пока недоступен.
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </header>
    </TooltipProvider>
  );
}
