## Валидация длины текста для Telegram

### Логика
- Лимит зависит от наличия медиа в текущем шаблоне:
  - `mediaType === 'none'` → **4096** символов (полноценное текстовое сообщение, `sendMessage`).
  - Любое медиа (`photo`/`video`/`document`/`album`) → **1024** символа (это caption: `sendPhoto`/`sendVideo`/`sendDocument`/`sendMediaGroup`).
- Считаем длину итоговой строки `message.text` через `[...str].length` (учёт суррогатных пар эмодзи), вместе со всеми символами форматирования MarkdownV2 (`*`, `_`, `\`, `[`, `]` и т. д.) — как требует Telegram.
- Применяем только для `message.platform === 'telegram'` и только когда поле текста активно (т. е. не `isHtml`, не `isSms`). Для остальных каналов поведение не меняем.

### UI
В `src/components/builder/EditorPanel.tsx` под `<textarea id="msg-body">` (после строки 496) для Telegram добавить строку-счётчик:
- Слева — короткая подсказка: «Лимит Telegram: 4096 (текст)» или «Лимит Telegram: 1024 (подпись к медиа)».
- Справа — счётчик `N / LIMIT`.
- Цвета:
  - `text-muted-foreground` по умолчанию,
  - `text-amber-600` при `length > LIMIT * 0.9`,
  - `text-destructive` + жирный при `length > LIMIT`.
- На самом `<textarea>` при превышении добавить рамку ошибки (`border-destructive focus:ring-destructive/20`).
- `maxLength` НЕ ставим (Telegram считает по итоговой строке с форматированием; пусть пользователь видит превышение и сам сократит, иначе MarkdownV2-разметка может неожиданно обрезаться).

### Блокировка сохранения
В `PreviewPanel.tsx` (кнопка «Сохранить шаблон» для Telegram) и в `SaveAllTemplatesDialog.tsx` (`isFilled` для telegram) — если `platform === 'telegram'` и длина текста превышает соответствующий лимит, считать шаблон невалидным:
- В PreviewPanel — дизейблить кнопку сохранения с тултипом «Превышен лимит Telegram: N/LIMIT».
- В SaveAll — `isFilled` возвращает `false` для telegram при превышении (галочка снимается, статус «Пусто»/добавим отдельный, либо переиспользуем существующий «Пусто» — на этом шаге оставим «Пусто», чтобы не разрастать дизайн).

### Хелпер
Добавить чистую функцию в `src/lib/message-builder.ts`:
```ts
export function telegramTextLimit(m: MessageData): number {
  return m.mediaType === 'none' ? 4096 : 1024;
}
export function telegramTextLength(m: MessageData): number {
  return [...(m.text || '')].length;
}
export function isTelegramTextValid(m: MessageData): boolean {
  if (m.platform !== 'telegram') return true;
  return telegramTextLength(m) <= telegramTextLimit(m);
}
```
Эти хелперы переиспользуются в EditorPanel, PreviewPanel и SaveAllTemplatesDialog.

### Затронутые файлы
- `src/lib/message-builder.ts` — добавить хелперы.
- `src/components/builder/EditorPanel.tsx` — счётчик + подсветка textarea для Telegram.
- `src/components/builder/PreviewPanel.tsx` — блокировка кнопки сохранения при превышении.
- `src/components/builder/SaveAllTemplatesDialog.tsx` — учесть лимит в `isFilled` для Telegram.

### Самопроверка
- Telegram без медиа: 4095 → ок, 4097 → красный счётчик, кнопка сохранения недоступна.
- Telegram с photo: лимит переключается на 1024 автоматически при выборе медиа.
- При переключении канала на MAX/Viber/WhatsApp/SMS/Email счётчик исчезает, ограничения не действуют.
