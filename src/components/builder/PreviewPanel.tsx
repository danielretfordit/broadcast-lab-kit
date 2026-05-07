import { useMessage } from '@/contexts/MessageContext';
import { ExternalLink, Save } from 'lucide-react';
import { toast } from 'sonner';
import maxLogo from '@/assets/max-logo.png';

const TELEGRAM_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg';

interface PreviewPanelProps {
  viewOnly?: boolean;
}

export default function PreviewPanel({ viewOnly }: PreviewPanelProps) {
  const { message } = useMessage();

  const albumUrls = (message.mediaUrls || []).filter(u => u && u.trim());
  const isAlbum = message.mediaType === 'album';
  const mediaInvalid =
    message.platform !== 'html' &&
    ((message.mediaType !== 'none' && message.mediaType !== 'album' && !message.mediaUrl.trim()) ||
      (isAlbum && albumUrls.length < 2));
  const saveDisabled = mediaInvalid;

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

    // Group consecutive "> " lines into blockquotes (markdown only)
    if ((message.parseMode === 'MarkdownV2' || message.parseMode === 'Markdown')) {
      const lines = text.split('\n');
      const groups: { quote: boolean; lines: string[] }[] = [];
      for (const ln of lines) {
        const isQuote = /^>\s?/.test(ln);
        const content = isQuote ? ln.replace(/^>\s?/, '') : ln;
        const last = groups[groups.length - 1];
        if (last && last.quote === isQuote) last.lines.push(content);
        else groups.push({ quote: isQuote, lines: [content] });
      }
      const out = groups.map(g => {
        const inner = renderInline(g.lines.join('\n'));
        return g.quote
          ? `<blockquote class="border-l-2 border-primary pl-2 my-1 text-muted-foreground italic">${inner}</blockquote>`
          : inner;
      }).join('');
      return <span dangerouslySetInnerHTML={{ __html: out }} />;
    }

    return <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />;
  };

  const isTelegram = message.platform === 'telegram';
  const isHtml = message.platform === 'html';

  const handleSaveToProject = () => {
    toast.success('Шаблон сохранён в проект', {
      description: 'JSON-структура успешно отправлена в SAP',
    });
  };

  const platformLabel = isHtml ? 'HTML' : isTelegram ? 'Telegram' : 'MAX';
  const platformLogo = isTelegram ? TELEGRAM_LOGO : isHtml ? null : maxLogo;

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
                isTelegram ? 'bg-[hsl(200,80%,50%)]' : 'bg-secondary'
              }`}>
                {platformLogo && <img src={platformLogo} alt="" className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{platformLabel} Preview</p>
                <p className="text-[10px] text-success font-medium">online</p>
              </div>
            </div>

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

            {!viewOnly && (
              <div className="mt-6 px-3 py-2 rounded-lg bg-muted text-[11px] text-muted-foreground max-w-xl">
                <span className="font-semibold">API Method: </span>
                {message.platform === 'telegram'
                  ? isAlbum
                    ? 'sendMediaGroup'
                    : message.mediaType !== 'none' && message.mediaUrl
                      ? `send${message.mediaType.charAt(0).toUpperCase()}${message.mediaType.slice(1)}`
                      : 'sendMessage'
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
          <button
            type="button"
            onClick={handleSaveToProject}
            disabled={saveDisabled}
            title={saveDisabled ? 'Заполните все ссылки на медиа перед сохранением' : ''}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            <Save size={15} />
            {saveDisabled ? 'Заполните медиа для сохранения' : 'Сохранить в проект'}
          </button>
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

