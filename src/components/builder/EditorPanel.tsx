import { useMessage } from '@/contexts/MessageContext';
import { generateId, type ButtonRow, type InlineButton } from '@/lib/message-builder';
import { Bold, Underline, Link, Image, Video, FileText, Plus, X, GripVertical } from 'lucide-react';

export default function EditorPanel() {
  const { message, updateField } = useMessage();

  const insertFormatting = (tag: string) => {
    const textarea = document.getElementById('msg-body') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = message.text.substring(start, end);

    let wrapped = '';
    if (message.parseMode === 'MarkdownV2') {
      if (tag === 'bold') wrapped = `*${selected || 'text'}*`;
      else if (tag === 'italic') wrapped = `_${selected || 'text'}_`;
      else if (tag === 'underline') wrapped = `__${selected || 'text'}__`;
      else if (tag === 'link') wrapped = `[${selected || 'text'}](url)`;
    } else {
      if (tag === 'bold') wrapped = `<b>${selected || 'text'}</b>`;
      else if (tag === 'italic') wrapped = `<i>${selected || 'text'}</i>`;
      else if (tag === 'underline') wrapped = `<u>${selected || 'text'}</u>`;
      else if (tag === 'link') wrapped = `<a href="url">${selected || 'text'}</a>`;
    }

    const newText = message.text.substring(0, start) + wrapped + message.text.substring(end);
    updateField('text', newText);
  };

  const addButtonRow = () => {
    const newRow: ButtonRow = {
      id: generateId(),
      buttons: [{ id: generateId(), text: 'Button', url: '' }],
    };
    updateField('buttonRows', [...message.buttonRows, newRow]);
  };

  const removeButtonRow = (rowId: string) => {
    updateField('buttonRows', message.buttonRows.filter(r => r.id !== rowId));
  };

  const addButtonToRow = (rowId: string) => {
    updateField('buttonRows', message.buttonRows.map(r =>
      r.id === rowId
        ? { ...r, buttons: [...r.buttons, { id: generateId(), text: 'Button', url: '' }] }
        : r
    ));
  };

  const updateButton = (rowId: string, btnId: string, field: keyof InlineButton, value: string) => {
    updateField('buttonRows', message.buttonRows.map(r =>
      r.id === rowId
        ? {
            ...r,
            buttons: r.buttons.map(b =>
              b.id === btnId ? { ...b, [field]: value } : b
            ),
          }
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
    { id: 'none' as const, icon: null, label: 'None' },
    { id: 'photo' as const, icon: Image, label: 'Photo' },
    { id: 'video' as const, icon: Video, label: 'Video' },
    { id: 'document' as const, icon: FileText, label: 'File' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 space-y-5">
      {/* Media Source */}
      <section>
        <label className="section-label">MEDIA CONTENT</label>
        <div className="flex gap-1 mb-3">
          {mediaTypes.map(mt => (
            <button
              key={mt.id}
              onClick={() => updateField('mediaType', mt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                message.mediaType === mt.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
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
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        )}
      </section>

      {/* Chat ID */}
      <section>
        <label className="section-label">CHAT ID</label>
        <input
          type="text"
          value={message.chatId}
          onChange={e => updateField('chatId', e.target.value)}
          placeholder="258110807"
          className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </section>

      {/* Message Body */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="section-label !mb-0">MESSAGE BODY</label>
          <div className="flex items-center gap-1">
            <select
              value={message.parseMode}
              onChange={e => updateField('parseMode', e.target.value as any)}
              className="text-[10px] px-2 py-1 rounded bg-secondary border border-border text-muted-foreground"
            >
              <option value="MarkdownV2">MarkdownV2</option>
              <option value="HTML">HTML</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-2">
          {[
            { tag: 'bold', icon: Bold },
            { tag: 'underline', icon: Underline },
            { tag: 'link', icon: Link },
          ].map(({ tag, icon: Icon }) => (
            <button
              key={tag}
              onClick={() => insertFormatting(tag)}
              className="w-8 h-8 rounded-md flex items-center justify-center bg-secondary hover:bg-surface-hover text-secondary-foreground transition-colors"
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        <textarea
          id="msg-body"
          value={message.text}
          onChange={e => updateField('text', e.target.value)}
          rows={6}
          placeholder={message.parseMode === 'MarkdownV2'
            ? '*Bold* _italic_ __underline__ [link](url)'
            : '<b>Bold</b> <i>italic</i> <u>underline</u> <a href="url">link</a>'}
          className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
      </section>

      {/* Action Buttons */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="section-label !mb-0">ACTION BUTTONS</label>
          <button
            onClick={addButtonRow}
            className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
          >
            <Plus size={12} /> ADD ROW
          </button>
        </div>

        <div className="space-y-3">
          {message.buttonRows.map(row => (
            <div key={row.id} className="rounded-lg border border-border bg-secondary/50 p-3 space-y-2">
              {row.buttons.map(btn => (
                <div key={btn.id} className="flex items-start gap-2">
                  <GripVertical size={14} className="mt-2.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={btn.text}
                      onChange={e => updateButton(row.id, btn.id, 'text', e.target.value)}
                      placeholder="Button text"
                      className="w-full px-2.5 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <input
                      type="text"
                      value={btn.url || ''}
                      onChange={e => updateButton(row.id, btn.id, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 rounded-md bg-muted border border-border text-xs text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <button
                    onClick={() => removeButton(row.id, btn.id)}
                    className="mt-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => addButtonToRow(row.id)}
                  className="text-[11px] text-muted-foreground hover:text-primary font-medium"
                >
                  + ADD BUTTON
                </button>
                <button
                  onClick={() => removeButtonRow(row.id)}
                  className="text-[11px] text-muted-foreground hover:text-destructive font-medium"
                >
                  REMOVE
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
