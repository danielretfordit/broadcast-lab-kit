# План изменений

## 1. Цитата `>` не должна экранироваться в MarkdownV2

**Файл:** `src/lib/markdown.ts`

Сейчас `>` — обычный спецсимвол MarkdownV2 и экранируется как `\>` везде. Telegram же распознаёт `>` в начале строки как блок-цитату и экранирование ломает рендер.

Логика: если `>` (опц. `> `) стоит в начале строки (после `\n` или в позиции 0), оставляем как есть; в середине строки — экранируем как раньше.

Реализация: в `escapeMarkdownV2Plain` (или отдельной пред-обработке `prepareMarkdownV2`) детектировать начало строки и пропускать ведущие `>` без обратного слеша. Все остальные правила MarkdownV2 не трогаем.

Также `>` для блок-цитаты должен быть только при `parseMode === 'MarkdownV2'` (для HTML — `<blockquote>`, уже работает).

## 2. Валидация перед «Сохранить в проект»

**Файл:** `src/components/builder/PreviewPanel.tsx`

В `PreviewPanel` кнопка "Сохранить в проект" сейчас всегда активна. Добавить:
- Если `mediaType !== 'none'` (включая новый `album`) и `mediaUrl` пуст / в альбоме нет ни одного валидного URL — кнопка `disabled`, тултип «Заполните ссылку на медиа».
- Визуально: серый фон, `cursor-not-allowed`.
- Дополнительно тот же чек уже подсвечивает поле в `EditorPanel` — оставляем как есть.

Также в `EditorPanel.tsx` для альбома проверка: хотя бы 2 непустых URL (Telegram требует 2–10).

## 3. Альбом фото для Telegram и MAX

### Модель данных

**Файл:** `src/lib/message-builder.ts`

```ts
mediaType: 'photo' | 'video' | 'document' | 'album' | 'none';
mediaUrls: string[]; // новый — для album
```

`mediaUrl` остаётся для одиночного медиа (обратная совместимость с существующими черновиками localStorage). При выборе `album` UI работает с `mediaUrls`.

### Editor

**Файл:** `src/components/builder/EditorPanel.tsx`

- Добавить новую кнопку выбора типа: `Альбом` (icon: `Images` из lucide).
- Когда `mediaType === 'album'`: вместо одного input — список `mediaUrls` с кнопками «+ Добавить фото» / «×» (мин. 2, макс. 10). Каждое поле — URL картинки.
- Caption (текст сообщения) применяется только к первому фото — подсказать пользователю надписью под полем.
- Скрыть выбор parse_mode только когда не альбом? Нет — оставляем (caption поддерживает MarkdownV2).
- Альбом доступен только для `telegram` и `max`. При платформе `html` пункт скрыт (он и так уже скрыт целиком).

### JSON-генерация

**Файл:** `src/lib/message-builder.ts`

Telegram (`buildTelegramJson`) — если `mediaType === 'album'` и есть ≥2 URL:
```json
{
  "chat_id": "...",
  "media": [
    { "type": "photo", "media": "<url1>", "caption": "<processed text>", "parse_mode": "MarkdownV2" },
    { "type": "photo", "media": "<url2>" },
    ...
  ]
}
```
Метод: `getTelegramMethod` возвращает `sendMediaGroup` для альбома.

MAX (`buildMaxJson`) — если `mediaType === 'album'`:
```json
{
  "text": "<text>",
  "attachments": [
    { "type": "image", "payload": { "url": "<url1>" } },
    ...
  ]
}
```

### Парсинг входящего JSON (вставка)

`parseTelegramJson`: если есть массив `media` с типом `photo` — `mediaType = 'album'`, `mediaUrls = media.map(m => m.media)`, `text = media[0].caption || ''`.

`parseMaxJson`: если в `attachments` несколько `type: image` — `mediaType = 'album'`, `mediaUrls = attachments.filter(...).map(a => a.payload.url)`.

### Превью

**Файл:** `src/components/builder/PreviewPanel.tsx`

При `mediaType === 'album' && mediaUrls.length > 0`:
- Сетка 2×N (как в Telegram): первое фото большое сверху, остальные плиткой 2 в ряд (для 2 фото — две колонки, для 3 — 1 большое + 2 справа, для 4+ — простая сетка `grid-cols-2`).
- Под альбомом — текст (caption) как обычно.
- Кнопки и метод API в нижней плашке: показывать `sendMediaGroup` (Telegram).

Тот же рендер применяется в `ViewOnlyPage` (использует `PreviewPanel`).

## Файлы

- `src/lib/markdown.ts` — не экранировать ведущий `>`.
- `src/lib/message-builder.ts` — тип `MessageData`, `createEmptyMessage`, `buildTelegramJson`, `buildMaxJson`, `parseTelegramJson`, `parseMaxJson`, `getTelegramMethod`.
- `src/components/builder/EditorPanel.tsx` — UI для альбома, валидация.
- `src/components/builder/PreviewPanel.tsx` — рендер альбома, disabled-состояние «Сохранить в проект».
- `src/contexts/MessageContext.tsx` — авто-миграция старых черновиков (добавить `mediaUrls: []`, если отсутствует).

## Технические детали

- `mediaUrls` в state всегда массив; при переключении типа медиа очищаем оба поля (`mediaUrl=''`, `mediaUrls=[]`).
- Caption в Telegram альбоме идёт только в первом элементе массива `media` вместе с `parse_mode`.
- `sendMediaGroup` не поддерживает `reply_markup` (inline кнопки) — выводим предупреждение в UI, если у альбома указаны кнопки, и не включаем их в JSON.
- Тестовая отправка (`JsonPanel`) для альбома работает без изменений: метод берётся из `getTelegramMethod`.
