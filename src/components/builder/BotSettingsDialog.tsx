import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Lock, Trash2 } from 'lucide-react';

const STORAGE_KEY_PREFIX = 'bot-settings:';
const CHAT_ID_PREFIX = 'bot-settings:chatId:';
const VIBER_SENDER_KEY = 'bot-settings:viber_bot:sender';

type BotPlatform = 'telegram' | 'max' | 'viber_bot';

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

interface BotSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: BotPlatform;
}

export default function BotSettingsDialog({ open, onOpenChange, platform }: BotSettingsDialogProps) {
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [sender, setSender] = useState('');

  useEffect(() => {
    if (open) {
      setToken(getBotToken(platform) || '');
      setChatId(getTestChatId(platform) || '');
      setSender(getViberBotSender() || '');
    }
  }, [open, platform]);

  const save = () => {
    try {
      if (token.trim()) {
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${platform}`, token.trim());
      } else {
        sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${platform}`);
      }
      if (chatId.trim()) {
        sessionStorage.setItem(`${CHAT_ID_PREFIX}${platform}`, chatId.trim());
      } else {
        sessionStorage.removeItem(`${CHAT_ID_PREFIX}${platform}`);
      }
      if (platform === 'viber_bot') {
        if (sender.trim()) sessionStorage.setItem(VIBER_SENDER_KEY, sender.trim());
        else sessionStorage.removeItem(VIBER_SENDER_KEY);
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
      if (platform === 'viber_bot') sessionStorage.removeItem(VIBER_SENDER_KEY);
    } catch {}
    toast.success('Очищено');
  };

  const isMax = platform === 'max';
  const isViberBot = platform === 'viber_bot';
  const title = isViberBot ? 'Viber бота' : isMax ? 'MAX бота' : 'Telegram бота';

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
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              {isViberBot ? 'Auth Token (X-Viber-Auth-Token)' : isMax ? 'Access Token' : 'Bot Token'}
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder={isViberBot ? 'aaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-cccccccccccccccc' : isMax ? 'f9LHodD0cOIR5XiHPjx5...' : '123456:AAH...'}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {isViberBot
                ? 'Токен авторизации из кабинета Viber'
                : isMax
                  ? 'Укажите Access Token, выданный платформой MAX'
                  : 'Получите токен у @BotFather в Telegram'}
            </p>
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

          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              {isViberBot ? 'Receiver ID (service_user_id)' : isMax ? 'Chat ID (user_id для теста)' : 'Chat ID для теста'}
            </label>
            <input
              type={isViberBot ? 'password' : 'text'}
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              placeholder={isViberBot ? '••••••••••••••••••••••••' : 'ID'}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {isViberBot
                ? 'Уникальный идентификатор получателя (Base64), выдаётся Viber API.'
                : 'Используется только при отправке тестового сообщения.'}
            </p>
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
