import { useEffect, useRef, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';

interface HtmlCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function HtmlCodeEditor({ value, onChange, placeholder }: HtmlCodeEditorProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const highlighted = value
    ? Prism.highlight(value, Prism.languages.markup, 'markup')
    : '';

  const syncScroll = useCallback(() => {
    if (textareaRef.current && codeRef.current) {
      codeRef.current.scrollTop = textareaRef.current.scrollTop;
      codeRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Validation
  const errors: string[] = [];
  if (value) {
    const openTags = value.match(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*(?<!\/)>/g) || [];
    const closeTags = value.match(/<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/g) || [];
    const selfClosing = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;

    const openCount: Record<string, number> = {};
    for (const tag of openTags) {
      const name = tag.match(/<([a-zA-Z][a-zA-Z0-9]*)/)?.[1]?.toLowerCase();
      if (name && !selfClosing.test(name)) {
        openCount[name] = (openCount[name] || 0) + 1;
      }
    }
    const closeCount: Record<string, number> = {};
    for (const tag of closeTags) {
      const name = tag.match(/<\/([a-zA-Z][a-zA-Z0-9]*)/)?.[1]?.toLowerCase();
      if (name) closeCount[name] = (closeCount[name] || 0) + 1;
    }

    for (const tag of Object.keys({ ...openCount, ...closeCount })) {
      const o = openCount[tag] || 0;
      const c = closeCount[tag] || 0;
      if (o > c) errors.push(`Незакрытый тег <${tag}> (${o - c})`);
      else if (c > o) errors.push(`Лишний закрывающий </${tag}> (${c - o})`);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="relative flex-1 min-h-0 rounded-lg border border-border overflow-hidden bg-card">
        {/* Highlighted layer */}
        <pre
          ref={codeRef}
          className="absolute inset-0 p-3 m-0 overflow-hidden pointer-events-none text-sm leading-relaxed font-mono whitespace-pre-wrap break-words"
          aria-hidden="true"
        >
          <code
            dangerouslySetInnerHTML={{ __html: highlighted || `<span style="color:hsl(var(--muted-foreground))">${placeholder || ''}</span>` }}
          />
        </pre>
        {/* Editable textarea on top, transparent text */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={syncScroll}
          placeholder=""
          spellCheck={false}
          className="absolute inset-0 w-full h-full p-3 m-0 text-sm leading-relaxed font-mono whitespace-pre-wrap break-words bg-transparent text-transparent caret-foreground resize-none focus:outline-none selection:bg-primary/30"
        />
      </div>
      {errors.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {errors.map((err, i) => (
            <p key={i} className="text-[11px] text-destructive flex items-center gap-1">
              ⚠ {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
