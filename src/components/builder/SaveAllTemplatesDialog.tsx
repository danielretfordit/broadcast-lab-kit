import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, Loader2, Save, Mail, MessageSquare, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { loadDraft } from '@/contexts/MessageContext';
import { useMessage } from '@/contexts/MessageContext';
import { buildEmailJson, buildMaxJson, buildTelegramJson, buildViberJson, buildViberBotJson, buildSmsJson, MessageData, Platform } from '@/lib/message-builder';
import maxLogo from '@/assets/max-logo.png';
import ViberBrandIcon from '@/components/icons/ViberBrandIcon';
import { Clock } from 'lucide-react';

const TELEGRAM_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const PLATFORMS: { key: Platform; label: string; paid?: boolean; dialog24h?: boolean }[] = [
  { key: 'telegram', label: 'Telegram' },
  { key: 'max', label: 'MAX' },
  { key: 'viber_business', label: 'Viber Business / SMS', paid: true },
  { key: 'viber_bot', label: 'Viber', dialog24h: true },
  { key: 'sms', label: 'SMS', paid: true },
  { key: 'html', label: 'HTML (Email)' },
];

function isFilled(m: MessageData): boolean {
  if (m.platform === 'sms') return !!(m.smsText && m.smsText.trim());
  const albumUrls = (m.mediaUrls || []).filter(u => u && u.trim());
  const isAlbum = m.mediaType === 'album';
  const hasValidMedia =
    (m.mediaType !== 'none' && m.mediaType !== 'album' && !!m.mediaUrl.trim()) ||
    (isAlbum && albumUrls.length >= 2);
  if (m.platform === 'viber_business') {
    const route = m.viberRoute || 'viber(60)-sms';
    const textOk = !!m.text.trim();
    const smsOk = !!(m.smsText && m.smsText.trim());
    if (route === 'sms-only') return smsOk;
    const mediaInvalid =
      (m.mediaType !== 'none' && m.mediaType !== 'album' && !m.mediaUrl.trim()) ||
      (isAlbum && albumUrls.length < 2);
    if (mediaInvalid) return false;
    if (route === 'viber-only') return textOk;
    return textOk && smsOk;
  }
  if (m.platform === 'viber_bot') {
    const textOk = !!m.text.trim();
    const mediaInvalid = m.mediaType !== 'none' && m.mediaType !== 'album' && !m.mediaUrl.trim();
    if (mediaInvalid) return false;
    return textOk || (m.mediaType !== 'none' && !!m.mediaUrl.trim());
  }
  const mediaInvalid =
    m.platform !== 'html' &&
    ((m.mediaType !== 'none' && m.mediaType !== 'album' && !m.mediaUrl.trim()) ||
      (isAlbum && albumUrls.length < 2));
  if (mediaInvalid) return false;
  const textEmpty = !m.text.trim();
  if (m.platform === 'html') return !!m.subject.trim() && !textEmpty;
  return !textEmpty || hasValidMedia;
}

function buildFor(p: Platform, m: MessageData): object {
  if (p === 'telegram') return buildTelegramJson(m);
  if (p === 'max') return buildMaxJson(m);
  if (p === 'viber_business') return buildViberJson(m);
  if (p === 'viber_bot') return buildViberBotJson(m);
  if (p === 'sms') return buildSmsJson(m);
  return buildEmailJson(m);
}

function PlatformIcon({ p }: { p: Platform }) {
  if (p === 'telegram') {
    return (
      <div className="w-7 h-7 rounded-full bg-[hsl(200,80%,50%)] flex items-center justify-center">
        <img src={TELEGRAM_LOGO} alt="" className="w-4 h-4" />
      </div>
    );
  }
  if (p === 'max') {
    return (
      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
        <img src={maxLogo} alt="" className="w-4 h-4" />
      </div>
    );
  }
  if (p === 'viber_business') {
    return (
      <div className="w-7 h-7 rounded-full bg-[#7360F2] flex items-center justify-center text-white">
        <MessageSquare size={14} />
      </div>
    );
  }
  if (p === 'viber_bot') {
    return <ViberBrandIcon className="w-7 h-7" style={{ color: '#7360F2' }} />;
  }
  if (p === 'sms') {
    return (
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        <MessageSquare size={14} />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground">
      <Mail size={14} />
    </div>
  );
}

export default function SaveAllTemplatesDialog({ open, onOpenChange }: Props) {
  const { message } = useMessage();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);

  const drafts = useMemo<Record<Platform, MessageData>>(() => {
    const get = (p: Platform) => (message.platform === p ? message : loadDraft(p));
    return {
      telegram: get('telegram'),
      max: get('max'),
      viber_business: get('viber_business'),
      viber_bot: get('viber_bot'),
      sms: get('sms'),
      html: get('html'),
    };
  }, [open, message]);

  const filledMap = useMemo(() => ({
    telegram: isFilled(drafts.telegram),
    max: isFilled(drafts.max),
    viber_business: isFilled(drafts.viber_business),
    viber_bot: isFilled(drafts.viber_bot),
    sms: isFilled(drafts.sms),
    html: isFilled(drafts.html),
  }), [drafts]);

  const [selected, setSelected] = useState<Record<Platform, boolean>>({
    telegram: true, max: true, viber_business: true, viber_bot: true, sms: true, html: true,
  });

  // Reset selection on open based on filled state
  useMemo(() => {
    if (open) {
      setSelected({
        telegram: filledMap.telegram,
        max: filledMap.max,
        viber_business: filledMap.viber_business,
        viber_bot: filledMap.viber_bot,
        sms: filledMap.sms,
        html: filledMap.html,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedCount = PLATFORMS.filter(p => selected[p.key] && filledMap[p.key]).length;
  const totalFilled = PLATFORMS.filter(p => filledMap[p.key]).length;

  const handleSave = async () => {
    const guid = searchParams.get('guid');
    const collection: Record<string, object> = {};
    for (const p of PLATFORMS) {
      if (selected[p.key] && filledMap[p.key]) {
        collection[p.key] = buildFor(p.key, drafts[p.key]);
      }
    }
    if (Object.keys(collection).length === 0) {
      toast.error('Нет выбранных шаблонов для сохранения');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/saveTemplate/?guid=${guid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: collection }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status > 202) {
        throw new Error(result.error || response.statusText);
      }
      toast.success('Шаблоны сохранены в проект', {
        description: `Отправлено каналов: ${Object.keys(collection).length}`,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error('Ошибка при сохранении шаблонов', {
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Сохранить все шаблоны</DialogTitle>
          <DialogDescription>
            Будут отправлены выбранные шаблоны единой коллекцией.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-2 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            <div>Канал</div>
            <div>Статус</div>
            <div>Включить</div>
          </div>
          {PLATFORMS.map(p => {
            const filled = filledMap[p.key];
            return (
              <div
                key={p.key}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 border-t border-border"
              >
                <div className="flex items-center gap-3">
                  <PlatformIcon p={p.key} />
                  <span className="text-sm font-medium text-foreground inline-flex items-center gap-1">
                    {p.label}
                    {p.paid && <Coins size={12} className="text-amber-500/80" />}
                    {p.dialog24h && (
                      <span
                        title="Окно 24 часа: можно писать только в течение 24 ч после последнего сообщения пользователя"
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 text-[9px] font-bold leading-none"
                      >
                        <Clock size={9} /> 24h
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  {filled ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-[11px] font-medium border border-success/30">
                      <CheckCircle2 size={12} /> Заполнен
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-medium border border-border">
                      <XCircle size={12} /> Пусто
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  <Checkbox
                    checked={selected[p.key] && filled}
                    disabled={!filled || saving}
                    onCheckedChange={(v) =>
                      setSelected(s => ({ ...s, [p.key]: !!v }))
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground text-right">
          Выбрано: {selectedCount} из {totalFilled}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selectedCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Сохранить выбранные шаблоны
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
