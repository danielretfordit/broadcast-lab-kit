import { useMessage } from '@/contexts/MessageContext';
import { Send } from 'lucide-react';

export default function PreviewPanel() {
  const { message } = useMessage();

  // Simple markdown to display text converter
  const renderText = (text: string) => {
    if (!text) return <span className="text-muted-foreground italic text-sm">No message text</span>;

    let html = text;
    if (message.parseMode === 'MarkdownV2') {
      // Bold
      html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
      // Underline
      html = html.replace(/__([^_]+)__/g, '<u>$1</u>');
      // Italic
      html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
      // Links
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-info underline">$1</a>');
      // Remove escape characters
      html = html.replace(/\\([_*\[\]()~`>#+\-=|{}.!])/g, '$1');
    }
    // For HTML mode, render as-is (sanitized)
    html = html.replace(/\n/g, '<br/>');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const isTelegram = message.platform === 'telegram';

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 font-medium">
        {isTelegram ? 'TELEGRAM' : 'MAX'} DEVICE PREVIEW
      </p>

      {/* Phone Frame */}
      <div className="relative w-[300px]">
        {/* Phone bezel */}
        <div className="rounded-[2rem] bg-muted border-2 border-border p-2 shadow-2xl">
          {/* Notch */}
          <div className="flex justify-center mb-1">
            <div className="w-20 h-5 bg-background rounded-b-xl flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-border" />
              <div className="w-8 h-1.5 rounded-full bg-border" />
            </div>
          </div>

          {/* Screen */}
          <div className="rounded-[1.25rem] bg-background overflow-hidden">
            {/* Status bar */}
            <div className={`px-4 py-2 flex items-center gap-2 ${
              isTelegram ? 'bg-info/20' : 'bg-primary/10'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isTelegram ? 'bg-info text-primary-foreground' : 'bg-primary text-primary-foreground'
              }`}>
                {isTelegram ? <Send size={12} /> : 'M'}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {isTelegram ? 'TELEGRAM' : 'MAX'}
                </p>
                <p className="text-[9px] text-success">online</p>
              </div>
            </div>

            {/* Chat area */}
            <div className="p-3 min-h-[350px] flex flex-col justify-end">
              {/* Message bubble */}
              <div className="max-w-[240px] self-start">
                {/* Media preview */}
                {message.mediaType !== 'none' && message.mediaUrl && (
                  <div className="rounded-t-xl overflow-hidden mb-0">
                    {message.mediaType === 'photo' ? (
                      <img
                        src={message.mediaUrl}
                        alt="media"
                        className="w-full h-36 object-cover bg-secondary"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-24 bg-secondary flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">
                          {message.mediaType === 'video' ? '🎬 Video' : '📎 Document'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Text */}
                {(message.text || message.mediaType === 'none') && (
                  <div className={`bg-secondary px-3 py-2 text-sm leading-relaxed text-foreground ${
                    message.mediaType !== 'none' && message.mediaUrl ? 'rounded-b-xl' : 'rounded-xl'
                  }`}>
                    {renderText(message.text)}
                    <div className="text-right mt-1">
                      <span className="text-[9px] text-muted-foreground">15:00 ✓✓</span>
                    </div>
                  </div>
                )}

                {/* Inline buttons */}
                {message.buttonRows.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {message.buttonRows.map(row => (
                      <div key={row.id} className="flex gap-1">
                        {row.buttons.map(btn => (
                          <button
                            key={btn.id}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                              isTelegram
                                ? 'bg-info/15 text-info hover:bg-info/25'
                                : 'bg-primary/15 text-primary hover:bg-primary/25'
                            }`}
                          >
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Input bar */}
            <div className="px-3 py-2 border-t border-border flex items-center gap-2">
              <div className="flex-1 h-8 rounded-full bg-secondary border border-border" />
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Send size={12} className="text-primary-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center mt-2">
          <div className="w-28 h-1 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    </div>
  );
}
