import { useState } from 'react';
import { useMessage } from '@/contexts/MessageContext';
import { ExternalLink, Save, Loader2, MoreVertical, Layers, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import maxLogo from '@/assets/max-logo.png';
import { useSearchParams } from 'react-router-dom';
import { buildJson } from '@/lib/message-builder';
import { smsParts } from '@/lib/sms';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import SaveAllTemplatesDialog from './SaveAllTemplatesDialog';

const TELEGRAM_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg';

interface PreviewPanelProps {
  viewOnly?: boolean;
}

export default function PreviewPanel({ viewOnly }: PreviewPanelProps) {
  const { message } = useMessage();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [saveAllOpen, setSaveAllOpen] = useState(false);
  const albumUrls = (message.mediaUrls || []).filter(u => u && u.trim());
  const isAlbum = message.mediaType === 'album';
  const isHtmlPlatform = message.platform === 'html';
  const isViberPlatform = message.platform === 'viber';
  const viberRoute = message.viberRoute || 'viber(60)-sms';
  const routeHasSms = isViberPlatform && viberRoute.includes('sms');
  const routeHasViber = isViberPlatform && viberRoute.startsWith('viber');
  const mediaInvalid =
    !isHtmlPlatform &&
    !(isViberPlatform && !routeHasViber) &&
    ((message.mediaType !== 'none' && message.mediaType !== 'album' && !message.mediaUrl.trim()) ||
      (isAlbum && albumUrls.length < 2));
  const textEmpty = !message.text.trim();
  const smsEmpty = !(message.smsText && message.smsText.trim());
  const hasValidMedia =
    (message.mediaType !== 'none' && message.mediaType !== 'album' && !!message.mediaUrl.trim()) ||
    (isAlbum && albumUrls.length >= 2);
  const emptyTemplate = isHtmlPlatform
    ? (!message.subject.trim() || textEmpty)
    : isViberPlatform
      ? (viberRoute === 'sms-only'
          ? smsEmpty
          : viberRoute === 'viber-only'
            ? textEmpty
            : (textEmpty || smsEmpty))
      : (textEmpty && !hasValidMedia);
  const saveDisabled = mediaInvalid || emptyTemplate;

  const renderText = (text: string) => {
    if (!text) return <span className="text-muted-foreground italic text-sm">Нет текста сообщения</span>;

    const renderInline = (raw: string): string => {
      let html = raw;
      if ((message.parseMode === 'MarkdownV2' || message.parseMode === 'Markdown')) {
        const isMax = message.platform === 'max';
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener">$1</a>');
        html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
        if (isMax) {
          html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
          html = html.replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>');
          html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>');
          html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
          html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
        } else {
          html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
          html = html.replace(/__([^_]+)__/g, '<u>$1</u>');
          html = html.replace(/~([^~]+)~/g, '<s>$1</s>');
          html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
        }
        html = html.replace(/\\([_*\[\]()~`>#+\-=|{}.!])/g, '$1');
      } else {
        // HTML mode: convert <blockquote> to styled markup
        html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi,
          '<blockquote class="border-l-2 border-primary pl-2 my-1 text-muted-foreground italic">$1</blockquote>');
      }
      html = html.replace(/\n/g, '<br/>');
      return html;
    };

    // Group consecutive "> " lines into blockquotes; render headings (markdown only)
    if ((message.parseMode === 'MarkdownV2' || message.parseMode === 'Markdown')) {
      const lines = text.split('\n');
      type Block = { kind: 'quote'; lines: string[] } | { kind: 'text'; lines: string[] } | { kind: 'h'; level: number; content: string };
      const blocks: Block[] = [];
      for (const ln of lines) {
        const hMatch = message.platform === 'max' ? /^(#{1,3})\s+(.*)$/.exec(ln) : null;
        if (hMatch) {
          blocks.push({ kind: 'h', level: hMatch[1].length, content: hMatch[2] });
          continue;
        }
        const isQuote = /^>\s?/.test(ln);
        const content = isQuote ? ln.replace(/^>\s?/, '') : ln;
        const last = blocks[blocks.length - 1];
        const targetKind = isQuote ? 'quote' : 'text';
        if (last && (last.kind === targetKind)) (last as { lines: string[] }).lines.push(content);
        else blocks.push({ kind: targetKind, lines: [content] } as Block);
      }
      const out = blocks.map(b => {
        if (b.kind === 'h') {
          const sizeCls = b.level === 1 ? 'text-lg font-bold' : b.level === 2 ? 'text-base font-bold' : 'text-sm font-semibold';
          return `<div class="${sizeCls} my-1">${renderInline(b.content)}</div>`;
        }
        const inner = renderInline(b.lines.join('\n'));
        return b.kind === 'quote'
          ? `<blockquote class="border-l-2 border-primary pl-2 my-1 text-muted-foreground italic">${inner}</blockquote>`
          : inner;
      }).join('');
      return <span dangerouslySetInnerHTML={{ __html: out }} />;
    }

    return <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />;
  };

  const isTelegram = message.platform === 'telegram';
  const isHtml = message.platform === 'html';
  const isViber = message.platform === 'viber';

  const handleSaveToProject = async () => {
    const guid = searchParams.get('guid');
    const data = {
      text: message.text,
      json: buildJson(message)
    };

    let body = JSON.stringify(data);

    setSaving(true);
    try {
      const response = await fetch(`/api/saveTemplate/?guid=${guid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body
      });

      const result = await response.json().catch(() => ({}));
      if (response.status > 202) {
        throw new Error("Ошибка при сохранении шаблона: " + (result.error || response.statusText));
      }

      toast.success('Шаблон сохранён в проект', {
        description: 'JSON-структура успешно отправлена в SAP',
      });
    } catch (error) {
      toast.error('Ошибка при сохранении шаблона');
    } finally {
      setSaving(false);
    }
  };

  const platformLabel = isHtml ? 'HTML' : isTelegram ? 'Telegram' : isViber ? 'Viber Business / SMS' : 'MAX';
  const platformLogo = isTelegram ? TELEGRAM_LOGO : isHtml || isViber ? null : maxLogo;

  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 overflow-y-auto ${isHtml ? 'p-0' : 'p-6'}`}>
        {isHtml ? (
          <div className="flex flex-col h-full">
            <div className="px-5 py-3 border-b border-border bg-muted/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Тема письма</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {message.subject || <span className="text-muted-foreground italic font-normal">Не указана</span>}
              </p>
            </div>
            <iframe
              title="HTML Preview"
              srcDoc={message.text || '<p style="color:#999;padding:20px;font-family:sans-serif;">Введите HTML код в редакторе...</p>'}
              className="w-full flex-1 border-0"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold ${
                isTelegram ? 'bg-[hsl(200,80%,50%)]' : isViber ? 'bg-[#7360F2]' : 'bg-secondary'
              }`}>
                {platformLogo && <img src={platformLogo} alt="" className="w-4 h-4" />}
                {isViber && <MessageSquare size={14} className="text-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{platformLabel} Preview</p>
                <p className="text-[10px] text-success font-medium">online</p>
              </div>
            </div>

            {(!isViber || routeHasViber) && (<>
            <div className="rounded-xl border border-border bg-card shadow-sm max-w-xl">

              {isAlbum && albumUrls.length > 0 && (
                <div className="rounded-t-xl overflow-hidden">
                  <AlbumGrid urls={albumUrls} />
                </div>
              )}
              {!isAlbum && message.mediaType !== 'none' && message.mediaUrl && (
                <div className="rounded-t-xl overflow-hidden">
                  {message.mediaType === 'photo' ? (
                    <img
                      src={message.mediaUrl}
                      alt="media preview"
                      className="w-full max-h-60 object-cover bg-muted"
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-full h-32 bg-muted flex items-center justify-center text-muted-foreground text-xs">⚠ Не удалось загрузить изображение</div>';
                      }}
                    />
                  ) : message.mediaType === 'video' ? (
                    <video
                      src={message.mediaUrl}
                      controls
                      className="w-full max-h-60 bg-muted"
                      onError={e => {
                        const target = e.target as HTMLVideoElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-full h-20 bg-muted flex items-center justify-center text-muted-foreground text-sm">🎬 Видео: ' + message.mediaUrl.split('/').pop() + '</div>';
                      }}
                    >
                      Видео не поддерживается
                    </video>
                  ) : (
                    <a
                      href={message.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full px-4 py-3 bg-muted hover:bg-secondary transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-lg flex-shrink-0">📎</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{message.mediaUrl.split('/').pop() || 'Документ'}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{message.mediaUrl}</p>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground flex-shrink-0 ml-auto" />
                    </a>
                  )}
                </div>
              )}

              <div className="px-4 py-3 text-sm leading-relaxed text-foreground">
                {renderText(message.text)}
                {!viewOnly && (
                  <div className="text-right mt-2">
                    <span className="text-[10px] text-muted-foreground">15:00 ✓✓</span>
                  </div>
                )}
              </div>
            </div>

            {!isAlbum && message.buttonRows.length > 0 && (
              <div className="mt-2 space-y-1.5 max-w-xl">
                {message.buttonRows.map(row => (
                  <div key={row.id} className="flex gap-1.5">
                    {row.buttons.map(btn =>
                      btn.url ? (
                        <a
                          key={btn.id}
                          href={btn.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer no-underline ${
                            isTelegram
                              ? 'border-info/30 text-info bg-info/5 hover:bg-info/10'
                              : 'border-accent/30 text-accent bg-accent/5 hover:bg-accent/10'
                          }`}
                        >
                          <ExternalLink size={12} />
                          {btn.text}
                        </a>
                      ) : (
                        <button
                          key={btn.id}
                          type="button"
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                            isTelegram
                              ? 'border-info/30 text-info bg-info/5 hover:bg-info/10'
                              : 'border-accent/30 text-accent bg-accent/5 hover:bg-accent/10'
                          }`}
                        >
                          {btn.text}
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}

            {isAlbum && message.buttonRows.length > 0 && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30 text-[11px] text-warning max-w-xl">
                ⚠ Inline-кнопки не отправляются вместе с альбомом фото
              </div>
            )}
            </>)}

            {isViber && routeHasSms && (() => {
              const info = smsParts(message.smsText || '');
              const tone =
                info.parts === 0 ? 'text-muted-foreground'
                : info.parts <= 1 ? 'text-success'
                : info.parts <= 3 ? 'text-warning'
                : 'text-destructive';
              return (
                <div className="mt-4 max-w-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare size={12} className="text-muted-foreground" />
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">SMS</p>
                    <span className={`ml-auto text-[11px] font-semibold ${tone}`}>
                      {info.len} симв. • {info.parts} SMS
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground font-mono whitespace-pre-wrap min-h-[48px]">
                    {message.smsText || <span className="text-muted-foreground italic font-sans">Текст SMS не указан</span>}
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Маршрут: <span className="font-mono">{viberRoute === 'viber-only' ? 'viber' : viberRoute === 'sms-only' ? 'sms' : viberRoute}</span> · кодировка <span className="font-mono">{info.encoding}</span>
                  </p>
                </div>
              );
            })()}

            {!viewOnly && (
              <div className="mt-6 px-3 py-2 rounded-lg bg-muted text-[11px] text-muted-foreground max-w-xl">
                <span className="font-semibold">API Method: </span>
                {message.platform === 'telegram'
                  ? isAlbum
                    ? 'sendMediaGroup'
                    : message.mediaType !== 'none' && message.mediaUrl
                      ? `send${message.mediaType.charAt(0).toUpperCase()}${message.mediaType.slice(1)}`
                      : 'sendMessage'
                  : isViber
                    ? `Provider · route: ${(viberRoute === 'viber-only' ? 'viber' : viberRoute === 'sms-only' ? 'sms' : viberRoute)}`
                    : 'POST /messages'}
                {' • '}
                {message.parseMode}
              </div>
            )}
          </>
        )}
      </div>

      {/* Save button footer */}
      {!viewOnly && (
        <div className="px-4 py-3 border-t border-border">
          {(() => {
            const disabledLabel = emptyTemplate
              ? 'Заполните шаблон для сохранения'
              : mediaInvalid
                ? 'Заполните медиа для сохранения'
                : 'Сохранить в проект';
            return (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveToProject}
                  disabled={saveDisabled || saving}
                  title={saveDisabled ? disabledLabel : ''}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? 'Сохранение...' : disabledLabel}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Дополнительно"
                      className="h-[42px] w-[42px] flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setSaveAllOpen(true)}>
                      <Layers size={14} className="mr-2" />
                      Сохранить все шаблоны
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })()}
          <SaveAllTemplatesDialog open={saveAllOpen} onOpenChange={setSaveAllOpen} />
        </div>
      )}
    </div>
  );
}

function AlbumGrid({ urls }: { urls: string[] }) {
  const count = urls.length;
  if (count === 1) {
    return <img src={urls[0]} alt="" className="w-full max-h-60 object-cover bg-muted" />;
  }
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 bg-muted">
        {urls.map((u, i) => (
          <img key={i} src={u} alt="" className="w-full h-32 object-cover bg-muted" />
        ))}
      </div>
    );
  }
  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 bg-muted">
        <img src={urls[0]} alt="" className="row-span-2 w-full h-full max-h-64 object-cover bg-muted" />
        <img src={urls[1]} alt="" className="w-full h-32 object-cover bg-muted" />
        <img src={urls[2]} alt="" className="w-full h-32 object-cover bg-muted" />
      </div>
    );
  }
  // 4+ — simple grid
  return (
    <div className="grid grid-cols-2 gap-0.5 bg-muted">
      {urls.slice(0, 10).map((u, i) => (
        <img key={i} src={u} alt="" className="w-full h-28 object-cover bg-muted" />
      ))}
    </div>
  );
}

