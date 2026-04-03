import { useState, useEffect, useCallback } from 'react';
import { useMessage } from '@/contexts/MessageContext';
import { buildJson, validateJson, extractJsonFromText } from '@/lib/message-builder';
import { Copy, Check, AlertCircle, CheckCircle2, Edit3, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function JsonPanel() {
  const { message, setMessage } = useMessage();
  const [editMode, setEditMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });
  const [copied, setCopied] = useState(false);

  const generatedJson = JSON.stringify(buildJson(message), null, 2);

  useEffect(() => {
    if (!editMode) {
      setJsonText(generatedJson);
      setValidation({ valid: true });
    }
  }, [generatedJson, editMode]);

  const handleJsonEdit = useCallback((value: string) => {
    setJsonText(value);
    setValidation(validateJson(value));
  }, []);

  const handlePasteRepair = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      try {
        JSON.parse(pasted);
      } catch {
        // Try to extract/repair JSON
        const repaired = extractJsonFromText(pasted);
        const result = validateJson(repaired);
        if (result.valid) {
          e.preventDefault();
          const formatted = JSON.stringify(JSON.parse(repaired), null, 2);
          setJsonText(formatted);
          setValidation({ valid: true });
          toast.success('JSON автоматически исправлен');
        }
      }
    }
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editMode ? jsonText : generatedJson);
      setCopied(true);
      toast.success('JSON скопирован в буфер обмена');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Ошибка копирования');
    }
  };

  const applyJsonChanges = () => {
    if (!validation.valid) return;
    try {
      const parsed = JSON.parse(jsonText);
      setMessage(prev => ({
        ...prev,
        text: parsed.text ?? parsed.caption ?? prev.text,
        chatId: parsed.chat_id != null ? String(parsed.chat_id) : prev.chatId,
      }));
      setEditMode(false);
      toast.success('Изменения применены');
    } catch {
      toast.error('Невалидный JSON');
    }
  };

  const lineCount = (editMode ? jsonText : generatedJson).split('\n').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            JSON {message.platform === 'telegram' ? '(Telegram)' : '(MAX)'}
          </h3>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            validation.valid
              ? 'bg-success/10 text-success'
              : 'bg-destructive/10 text-destructive'
          }`}>
            {validation.valid ? (
              <><CheckCircle2 size={10} /> VALID</>
            ) : (
              <><AlertCircle size={10} /> ERROR</>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-md transition-colors ${
              editMode
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground hover:bg-secondary'
            }`}
          >
            {editMode ? <><Eye size={11} /> Просмотр</> : <><Edit3 size={11} /> Редакт.</>}
          </button>
          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
      </div>

      {/* JSON content */}
      <div className="flex-1 overflow-auto p-4">
        {editMode ? (
          <div>
            <div className="flex">
              <div className="w-8 text-right pr-2 select-none flex-shrink-0">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i} className="text-[10px] leading-5 text-muted-foreground/40 font-mono">{i + 1}</div>
                ))}
              </div>
              <textarea
                value={jsonText}
                onChange={e => handleJsonEdit(e.target.value)}
                onPaste={handlePasteRepair}
                className="flex-1 min-h-[400px] bg-transparent text-foreground font-mono text-sm leading-5 resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>
            {validation.valid && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={applyJsonChanges}
                  className="px-4 py-2 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors"
                >
                  Применить изменения
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Отмена
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex">
            <div className="w-8 text-right pr-2 select-none flex-shrink-0">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="text-[10px] leading-5 text-muted-foreground/40 font-mono">{i + 1}</div>
              ))}
            </div>
            <pre className="text-sm leading-5 font-mono whitespace-pre-wrap flex-1">
              <JsonHighlighter json={generatedJson} />
            </pre>
          </div>
        )}
      </div>

      {/* Validation error */}
      {!validation.valid && validation.error && (
        <div className="px-4 py-2 border-t border-destructive/20 bg-destructive/5">
          <p className="text-xs text-destructive font-mono">{validation.error}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {message.platform === 'telegram' ? 'Telegram Bot API' : 'MAX API'} • {message.parseMode}
        </span>
        <span>
          {message.platform === 'telegram'
            ? message.mediaType !== 'none' && message.mediaUrl
              ? `send${message.mediaType.charAt(0).toUpperCase()}${message.mediaType.slice(1)}`
              : 'sendMessage'
            : 'messages/send'}
        </span>
      </div>
    </div>
  );
}

function JsonHighlighter({ json }: { json: string }) {
  const highlighted = json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color:hsl(210,85%,52%)">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:hsl(25,90%,52%)">$1</span>')
    .replace(/:\s*(\d+)/g, ': <span style="color:hsl(152,60%,42%)">$1</span>');

  return <code dangerouslySetInnerHTML={{ __html: highlighted }} />;
}
