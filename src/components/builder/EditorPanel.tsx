import { useState } from 'react';
import { useMessage } from '@/contexts/MessageContext';
import { generateId, type ButtonRow, type InlineButton } from '@/lib/message-builder';
import { Bold, Underline, Italic, Link, Image, Video, FileText, Plus, X, GripVertical, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function EditorPanel() {
  const { message, updateField } = useMessage();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const insertFormatting = (tag: string) => {
    const textarea = document.getElementById('msg-body') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = message.text.substring(start, end);

    let wrapped = '';
    if (message.parseMode === 'MarkdownV2') {
      if (tag === 'bold') wrapped = `*${selected || 'текст'}*`;
      else if (tag === 'italic') wrapped = `_${selected || 'текст'}_`;
      else if (tag === 'underline') wrapped = `__${selected || 'текст'}__`;
      else if (tag === 'link') wrapped = `[${selected || 'текст'}](url)`;
    } else {
      if (tag === 'bold') wrapped = `<b>${selected || 'текст'}</b>`;
      else if (tag === 'italic') wrapped = `<i>${selected || 'текст'}</i>`;
      else if (tag === 'underline') wrapped = `<u>${selected || 'текст'}</u>`;
      else if (tag === 'link') wrapped = `<a href="url">${selected || 'текст'}</a>`;
    }

    const newText = message.text.substring(0, start) + wrapped + message.text.substring(end);
    updateField('text', newText);
    // Restore focus after state update
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + wrapped.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const addButtonRow = () => {
    const newRow: ButtonRow = {
      id: generateId(),
      buttons: [{ id: generateId(), text: 'Кнопка', url: '' }],
    };
    updateField('buttonRows', [...message.buttonRows, newRow]);
  };

  const removeButtonRow = (rowId: string) => {
    updateField('buttonRows', message.buttonRows.filter(r => r.id !== rowId));
  };

  const addButtonToRow = (rowId: string) => {
    updateField('buttonRows', message.buttonRows.map(r =>
      r.id === rowId
        ? { ...r, buttons: [...r.buttons, { id: generateId(), text: 'Кнопка', url: '' }] }
        : r
    ));
  };

  const updateButton = (rowId: string, btnId: string, field: keyof InlineButton, value: string) => {
    updateField('buttonRows', message.buttonRows.map(r =>
      r.id === rowId
        ? { ...r, buttons: r.buttons.map(b => b.id === btnId ? { ...b, [field]: value } : b) }
        : r
    ));
  };

  const removeButton = (rowId: string, btnId: string) => {
    updateField('buttonRows', message.buttonRows.map(r =>
      r.id === rowId
        ? { ...r, buttons: r.buttons.filter(b => b.id !== btnId) }
        : r
    ).filter(r => r.buttons.length > 0));
  };

  const mediaTypes = [
    { id: 'none' as const, icon: null, label: 'Нет' },
    { id: 'photo' as const, icon: Image, label: 'Фото' },
    { id: 'video' as const, icon: Video, label: 'Видео' },
    { id: 'document' as const, icon: FileText, label: 'Файл' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 space-y-5 pb-10">
      {/* Media */}
      <section>
        <label className="section-label">Медиа контент</label>
        <div className="flex gap-1 mb-3">
          {mediaTypes.map(mt => (
            <button
              key={mt.id}
              type="button"
              onClick={() => updateField('mediaType', mt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                message.mediaType === mt.id
                  ? 'bg-primary/10 text-primary border border-primary/25 shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              {mt.icon && <mt.icon size={13} />}
              {mt.label}
            </button>
          ))}
        </div>
        {message.mediaType !== 'none' && (
          <input
            type="text"
            value={message.mediaUrl}
            onChange={e => updateField('mediaUrl', e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        )}
      </section>

      {/* Chat ID */}
      <section>
        <label className="section-label">Chat ID</label>
        <input
          type="text"
          value={message.chatId}
          onChange={e => updateField('chatId', e.target.value)}
          placeholder="258110807"
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
        />
      </section>

      {/* Message Body */}
      <section className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <label className="section-label !mb-0">Текст сообщения</label>
          <select
            value={message.parseMode}
            onChange={e => updateField('parseMode', e.target.value as 'MarkdownV2' | 'HTML')}
            className="text-[10px] px-2 py-1 rounded bg-muted border border-border text-muted-foreground cursor-pointer"
          >
            <option value="MarkdownV2">MarkdownV2</option>
            <option value="HTML">HTML</option>
          </select>
        </div>

        <div className="flex items-center gap-1 mb-2">
          {[
            { tag: 'bold', icon: Bold, title: 'Жирный' },
            { tag: 'italic', icon: Italic, title: 'Курсив' },
            { tag: 'underline', icon: Underline, title: 'Подчёркнутый' },
            { tag: 'link', icon: Link, title: 'Ссылка' },
          ].map(({ tag, icon: Icon, title }) => (
            <button
              key={tag}
              type="button"
              title={title}
              onClick={() => insertFormatting(tag)}
              className="w-8 h-8 rounded-md flex items-center justify-center bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        <textarea
          id="msg-body"
          value={message.text}
          onChange={e => updateField('text', e.target.value)}
          placeholder={message.parseMode === 'MarkdownV2'
            ? '*Жирный* _курсив_ __подчёркнутый__ [ссылка](url)'
            : '<b>Жирный</b> <i>курсив</i> <u>подчёркнутый</u> <a href="url">ссылка</a>'}
          className="w-full flex-1 min-h-[200px] px-3 py-3 rounded-lg bg-card border border-border text-sm text-foreground font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-y"
        />
      </section>

      {/* AI Editor */}
      <section>
        <button
          type="button"
          onClick={() => setShowAi(!showAi)}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed border-primary/30 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
        >
          <Sparkles size={14} />
          AI-редактор сообщения
        </button>
        {showAi && (
          <div className="mt-2 space-y-2">
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Опишите что сделать с текстом: «Сделай более продающим», «Добавь эмодзи», «Переведи на английский»..."
              className="w-full min-h-[80px] px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-y"
            />
            <button
              type="button"
              disabled={aiLoading || !aiPrompt.trim()}
              onClick={async () => {
                setAiLoading(true);
                try {
                  const { data, error } = await supabase.functions.invoke('ai-message-editor', {
                    body: { prompt: aiPrompt, currentText: message.text, parseMode: message.parseMode },
                  });
                  if (error) throw error;
                  if (data?.text) {
                    updateField('text', data.text);
                    setAiPrompt('');
                    toast.success('Текст обновлён с помощью AI');
                  }
                } catch (err: any) {
                  console.error(err);
                  toast.error(err?.message || 'Ошибка AI');
                } finally {
                  setAiLoading(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {aiLoading ? 'Генерация...' : 'Применить AI'}
            </button>
          </div>
        )}
      </section>

      {/* Action Buttons */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="section-label !mb-0">Inline кнопки</label>
          <button
            type="button"
            onClick={addButtonRow}
            className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus size={12} /> Добавить ряд
          </button>
        </div>

        <div className="space-y-3">
          {message.buttonRows.map(row => (
            <div key={row.id} className="rounded-lg border border-border bg-card p-3 space-y-2 shadow-sm">
              {row.buttons.map(btn => (
                <div key={btn.id} className="flex items-start gap-2">
                  <GripVertical size={14} className="mt-2.5 text-muted-foreground/50 flex-shrink-0 cursor-grab" />
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={btn.text}
                      onChange={e => updateButton(row.id, btn.id, 'text', e.target.value)}
                      placeholder="Текст кнопки"
                      className="w-full px-2.5 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <input
                      type="text"
                      value={btn.url || ''}
                      onChange={e => updateButton(row.id, btn.id, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 rounded-md bg-muted border border-border text-xs text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeButton(row.id, btn.id)}
                    className="mt-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => addButtonToRow(row.id)}
                  className="text-[11px] text-muted-foreground hover:text-primary font-medium transition-colors"
                >
                  + Кнопка
                </button>
                <button
                  type="button"
                  onClick={() => removeButtonRow(row.id)}
                  className="text-[11px] text-muted-foreground hover:text-destructive font-medium transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
