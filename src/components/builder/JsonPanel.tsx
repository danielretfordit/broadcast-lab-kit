import { useState, useEffect, useCallback } from 'react';
import { useMessage } from '@/contexts/MessageContext';
import { buildJson, validateJson } from '@/lib/message-builder';
import { Copy, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editMode ? jsonText : generatedJson);
      setCopied(true);
      toast.success('JSON скопирован');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Ошибка копирования');
    }
  };

  const applyJsonChanges = () => {
    if (!validation.valid) return;
    try {
      const parsed = JSON.parse(jsonText);
      // Try to map back to message fields
      if (parsed.text !== undefined) {
        setMessage(prev => ({ ...prev, text: parsed.text }));
      }
      if (parsed.caption !== undefined) {
        setMessage(prev => ({ ...prev, text: parsed.caption }));
      }
      if (parsed.chat_id !== undefined) {
        setMessage(prev => ({ ...prev, chatId: String(parsed.chat_id) }));
      }
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
            {message.platform === 'telegram' ? 'JSON Structure (TG)' : 'JSON Structure (MAX)'}
          </h3>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            validation.valid
              ? 'bg-success/15 text-success'
              : 'bg-destructive/15 text-destructive'
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
            onClick={() => setEditMode(!editMode)}
            className={`text-[11px] font-medium px-3 py-1 rounded-md transition-colors ${
              editMode
                ? 'bg-primary/15 text-primary'
                : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
            }`}
          >
            {editMode ? 'EDITING' : 'EDIT'}
          </button>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'COPIED' : 'COPY JSON'}
          </button>
        </div>
      </div>

      {/* JSON content */}
      <div className="flex-1 overflow-auto p-4 relative">
        {editMode ? (
          <div className="relative">
            <div className="absolute left-0 top-0 w-8 text-right pr-2 select-none">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="text-[10px] leading-5 text-muted-foreground/40 font-mono">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              value={jsonText}
              onChange={e => handleJsonEdit(e.target.value)}
              className="w-full min-h-[400px] pl-10 bg-transparent text-foreground font-mono text-sm leading-5 resize-none focus:outline-none"
              spellCheck={false}
            />
            {validation.valid && (
              <div className="mt-3">
                <button
                  onClick={applyJsonChanges}
                  className="px-4 py-2 rounded-lg bg-success/15 text-success text-xs font-semibold hover:bg-success/25 transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-0 top-0 w-8 text-right pr-2 select-none">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="text-[10px] leading-5 text-muted-foreground/40 font-mono">
                  {i + 1}
                </div>
              ))}
            </div>
            <pre className="pl-10 text-sm leading-5 font-mono whitespace-pre-wrap">
              <JsonHighlighter json={generatedJson} />
            </pre>
          </div>
        )}
      </div>

      {/* Validation error */}
      {!validation.valid && validation.error && (
        <div className="px-4 py-2 border-t border-destructive/30 bg-destructive/5">
          <p className="text-xs text-destructive font-mono">{validation.error}</p>
        </div>
      )}

      {/* Footer info */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {message.platform === 'telegram' ? 'Telegram Bot API' : 'MAX (TamTam) API'} •{' '}
          {message.parseMode}
        </span>
        <span>
          {message.platform === 'telegram'
            ? message.mediaType !== 'none' ? 'send' + message.mediaType.charAt(0).toUpperCase() + message.mediaType.slice(1) : 'sendMessage'
            : 'messages/send'
          }
        </span>
      </div>
    </div>
  );
}

function JsonHighlighter({ json }: { json: string }) {
  const highlighted = json.replace(
    /("(?:[^"\\]|\\.)*")\s*:/g,
    '<span class="text-info">$1</span>:'
  ).replace(
    /:\s*("(?:[^"\\]|\\.)*")/g,
    ': <span class="text-primary">$1</span>'
  ).replace(
    /:\s*(\d+)/g,
    ': <span class="text-warning">$1</span>'
  );

  return <code dangerouslySetInnerHTML={{ __html: highlighted }} />;
}
