import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Lock, Trash2 } from 'lucide-react';

const STORAGE_KEY_PREFIX = 'bot-settings:';
const CHAT_ID_PREFIX = 'bot-settings:chatId:';

export function getBotToken(platform: 'telegram' | 'max'): string | null {
  try {
    return sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${platform}`);
  } catch {
    return null;
  }
}

export function getTestChatId(platform: 'telegram' | 'max'): string | null {
  try {
    return sessionStorage.getItem(`${CHAT_ID_PREFIX}${platform}`);
  } catch {
    return null;
  }
}

interface BotSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: 'telegram' | 'max';
}

export default function BotSettingsDialog({ open, onOpenChange, platform }: BotSettingsDialogProps) {
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');

  useEffect(() => {
    if (open) {
      setToken(getBotToken(platform) || '');
      setChatId(getTestChatId(platform) || '');
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
      toast.success('Сохранено в этой сессии');
      onOpenChange(false);
    } catch {
      toast.error('Не удалось сохранить');
    }
  };

  const clear = () => {
    setToken('');
    setChatId('');
    try {
      sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${platform}`);
      sessionStorage.removeItem(`${CHAT_ID_PREFIX}${platform}`);
    } catch {}
    toast.success('Очищено');
  };

  const isMax = platform === 'max';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            Настройки {isMax ? 'MAX' : 'Telegram'} бота
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Токен и Chat ID хранятся только в этой вкладке браузера и автоматически очищаются при её закрытии.
            Никуда не отправляются.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              {isMax ? 'Access Token' : 'Bot Token'}
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder={isMax ? 'f9LHodD0cOIR5XiHPjx5...' : '123456:AAH...'}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {isMax
                ? 'Укажите Access Token, выданный платформой MAX'
                : 'Получите токен у @BotFather в Telegram'}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              {isMax ? 'Chat ID (user_id для теста)' : 'Chat ID для теста'}
            </label>
            <input
              type="text"
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              placeholder="условный"
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Используется только при отправке тестового сообщения.
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
