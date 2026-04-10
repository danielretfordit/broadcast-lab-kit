import { useMemo } from 'react';

interface HtmlCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function HtmlCodeEditor({ value, onChange, placeholder }: HtmlCodeEditorProps) {
  const errors = useMemo(() => {
    const nextErrors: string[] = [];

    if (!value) return nextErrors;

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
      if (o > c) nextErrors.push(`Незакрытый тег <${tag}> (${o - c})`);
      else if (c > o) nextErrors.push(`Лишний закрывающий </${tag}> (${c - o})`);
    }

    return nextErrors;
  }, [value]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="relative flex-1 min-h-0 rounded-lg border border-border overflow-hidden bg-card">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="block w-full h-full min-h-[260px] p-3 overflow-auto border-0 bg-transparent text-sm text-foreground leading-[1.6] font-mono whitespace-pre-wrap [overflow-wrap:anywhere] resize-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
          style={{ tabSize: 2 }}
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
