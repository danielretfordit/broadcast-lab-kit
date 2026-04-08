import { useMemo } from 'react';
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

  const renderText = (text: string) => {
    if (!text) return <span className="text-muted-foreground italic text-sm">Нет текста сообщения</span>;

    if (message.platform === 'html') {
      return null; // HTML rendered separately via iframe
    }

    let html = text;
    if (message.parseMode === 'MarkdownV2') {
      const isMax = message.platform === 'max';
      // Links first (same for both)
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener">$1</a>');
      // Code
      html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
      if (isMax) {
        // MAX: **bold** or __bold__, ++underline++, ~~strikethrough~~, *italic* or _italic_
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        html = html.replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>');
        html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
      } else {
        // Telegram: *bold*, __underline__, ~strikethrough~, _italic_
        html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<u>$1</u>');
        html = html.replace(/~([^~]+)~/g, '<s>$1</s>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
      }
      html = html.replace(/\\([_*\[\]()~`>#+\-=|{}.!])/g, '$1');
    }
    html = html.replace(/\n/g, '<br/>');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
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
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold ${
            isHtml ? 'bg-[hsl(280,60%,55%)]' : isTelegram ? 'bg-[hsl(200,80%,50%)]' : 'bg-secondary'
          }`}>
            {platformLogo ? (
              <img src={platformLogo} alt="" className="w-4 h-4" />
            ) : (
              <span className="text-[10px] text-white font-bold">{'</>'}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{platformLabel} Preview</p>
            <p className="text-[10px] text-success font-medium">online</p>
          </div>
        </div>

        {/* Message card */}
        <div className="rounded-xl border border-border bg-card shadow-sm max-w-xl">
          {message.mediaType !== 'none' && message.mediaUrl && (
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
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-lg flex-shrink-0">
                    📎
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {message.mediaUrl.split('/').pop() || 'Документ'}
                    </p>
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

        {message.buttonRows.length > 0 && (
          <div className="mt-2 space-y-1.5 max-w-xl">
            {message.buttonRows.map(row => (
              <div key={row.id} className="flex gap-1.5">
                {row.buttons.map(btn => (
                  <button
                    key={btn.id}
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      isTelegram
                        ? 'border-info/30 text-info bg-info/5 hover:bg-info/10'
                        : 'border-accent/30 text-accent bg-accent/5 hover:bg-accent/10'
                    }`}
                  >
                    {btn.url && <ExternalLink size={12} />}
                    {btn.text}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {!isHtml && !viewOnly && (
          <div className="mt-6 px-3 py-2 rounded-lg bg-muted text-[11px] text-muted-foreground max-w-xl">
            <span className="font-semibold">API Method: </span>
            {message.platform === 'telegram'
              ? message.mediaType !== 'none' && message.mediaUrl
                ? `send${message.mediaType.charAt(0).toUpperCase()}${message.mediaType.slice(1)}`
                : 'sendMessage'
              : 'POST /messages'}
            {' • '}
            {message.parseMode}
          </div>
        )}
      </div>

      {/* Save button footer */}
      {!viewOnly && (
        <div className="px-4 py-3 border-t border-border">
          <button
            type="button"
            onClick={handleSaveToProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Save size={15} />
            Сохранить в проект
          </button>
        </div>
      )}
    </div>
  );
}
