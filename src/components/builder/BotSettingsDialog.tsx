import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Lock, Trash2 } from 'lucide-react';

const STORAGE_KEY_PREFIX = 'bot-settings:';
const CHAT_ID_PREFIX = 'bot-settings:chatId:';
const VIBER_SENDER_KEY = 'bot-settings:viber_bot:sender';
const WA_SENDER_KEY = 'bot-settings:whatsapp:sender';

type BotPlatform = 'telegram' | 'max' | 'viber_bot' | 'whatsapp';

export function getBotToken(platform: BotPlatform): string | null {
  try {
    return sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${platform}`);
  } catch {
    return null;
  }
}

export function getTestChatId(platform: BotPlatform): string | null {
  try {
    return sessionStorage.getItem(`${CHAT_ID_PREFIX}${platform}`);
  } catch {
    return null;
  }
}

export function getViberBotSender(): string | null {
  try {
    return sessionStorage.getItem(VIBER_SENDER_KEY);
  } catch {
    return null;
  }
}

export function getWhatsAppSender(): string | null {
  try {
    return sessionStorage.getItem(WA_SENDER_KEY);
  } catch {
    return null;
  }
}

interface BotSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: BotPlatform;
}

export default function BotSettingsDialog({ open, onOpenChange, platform }: BotSettingsDialogProps) {
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [sender, setSender] = useState('');

  const isMax = platform === 'max';
  const isViberBot = platform === 'viber_bot';
  const isWhatsApp = platform === 'whatsapp';

  useEffect(() => {
    if (open) {
      setToken(getBotToken(platform) || '');
      setChatId(getTestChatId(platform) || '');
      if (isViberBot) {
        setSender(getViberBotSender() || 'ARMTEK | ЧАТ-БОТ | BY');
      } else if (isWhatsApp) {
        setSender(getWhatsAppSender() || '');
      } else {
        setSender('');
      }
    }
  }, [open, platform, isViberBot, isWhatsApp]);

  const save = () => {
    try {
      if (token.trim()) sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${platform}`, token.trim());
      else sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${platform}`);
      if (chatId.trim()) sessionStorage.setItem(`${CHAT_ID_PREFIX}${platform}`, chatId.trim());
      else sessionStorage.removeItem(`${CHAT_ID_PREFIX}${platform}`);
      if (isViberBot) {
        if (sender.trim()) sessionStorage.setItem(VIBER_SENDER_KEY, sender.trim());
        else sessionStorage.removeItem(VIBER_SENDER_KEY);
      } else if (isWhatsApp) {
        if (sender.trim()) sessionStorage.setItem(WA_SENDER_KEY, sender.trim());
        else sessionStorage.removeItem(WA_SENDER_KEY);
      }
      toast.success('Сохранено в этой сессии');
      onOpenChange(false);
    } catch {
      toast.error('Не удалось сохранить');
    }
  };

  const clear = () => {
    setToken('');
    setChatId('');
    setSender('');
    try {
      sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${platform}`);
      sessionStorage.removeItem(`${CHAT_ID_PREFIX}${platform}`);
      if (isViberBot) sessionStorage.removeItem(VIBER_SENDER_KEY);
      if (isWhatsApp) sessionStorage.removeItem(WA_SENDER_KEY);
    } catch {}
    toast.success('Очищено');
  };

  const title = isViberBot ? 'Viber бота' : isMax ? 'MAX бота' : isWhatsApp ? 'WhatsApp' : 'Telegram бота';

  const tokenLabel = isViberBot
    ? 'Auth Token (X-Viber-Auth-Token)'
    : isMax
      ? 'Access Token'
      : isWhatsApp
        ? 'API Token (apikey)'
        : 'Bot Token';

  const tokenPlaceholder = isViberBot
    ? 'aaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-cccccccccccccccc'
    : isMax
      ? 'f9LHodD0cOIR5XiHPjx5...'
      : isWhatsApp
        ? 'Tyntec apikey'
        : '123456:AAH...';

  const tokenHint = isViberBot
    ? 'Токен авторизации из кабинета Viber'
    : isMax
      ? 'Укажите Access Token, выданный платформой MAX'
      : isWhatsApp
        ? 'Tyntec API key (заголовок apikey)'
        : 'Получите токен у @BotFather в Telegram';

  const receiverLabel = isViberBot
    ? 'Receiver ID (service_user_id)'
    : isMax
      ? 'Chat ID (user_id для теста)'
      : isWhatsApp
        ? 'Receiver ID (to)'
        : 'Chat ID для теста';

  const receiverPlaceholder = isViberBot
    ? '••••••••••••••••••••••••'
    : isWhatsApp
      ? '79991234567'
      : 'ID';

  const receiverHint = isViberBot
    ? 'Уникальный идентификатор получателя (Base64), выдаётся Viber API.'
    : isWhatsApp
      ? 'Номер получателя в формате E.164 без «+» (например, 79991234567).'
      : 'Используется только при отправке тестового сообщения.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            Настройки {title}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Все значения хранятся только в этой вкладке браузера и автоматически очищаются при её закрытии.
            Никуда не отправляются.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">{tokenLabel}</label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder={tokenPlaceholder}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">{tokenHint}</p>
          </div>

          {isViberBot && (
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Имя бота (sender.name)
              </label>
              <input
                type="text"
                value={sender}
                onChange={e => setSender(e.target.value)}
                placeholder="ARMTEK | ЧАТ-БОТ | BY"
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Имя отправителя, которое увидит получатель.
              </p>
            </div>
          )}

          {isWhatsApp && (
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Sender ID (from)
              </label>
              <input
                type="text"
                value={sender}
                onChange={e => setSender(e.target.value)}
                placeholder="WABA номер отправителя"
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Номер отправителя WhatsApp Business в формате E.164 без «+».
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">{receiverLabel}</label>
            <input
              type={isViberBot ? 'password' : 'text'}
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              placeholder={receiverPlaceholder}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">{receiverHint}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-secondary transition-colors"
          >
            <Trash2 size={12} /> Очистить
          </button>
          <button
            type="button"
            onClick={save}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            Сохранить
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
