## Цели

1. Передавать корректный `parseMode` в AI-редактор для каждой платформы.
2. Убрать выбор HTML-формата в селекторе для Telegram и MAX.
3. Починить тестовую отправку в MAX (`Failed to fetch` — CORS из браузера на `platform-api.max.ru`).

---

## 1) AI parseMode в EditorPanel + edge функция

**`src/components/builder/EditorPanel.tsx`** (`handleAiMessenger`):
- Вычислять `aiParseMode`:
  - `telegram` → `'MarkdownV2'`
  - `max` → `'Markdown'`
  - `html` → `'HTML'`
- Передавать его в body вызова `ai-message-editor` вместо `message.parseMode`.

**`supabase/functions/ai-message-editor/index.ts`**:
- Расширить инструкцию системного промпта: ветка `MarkdownV2` (Telegram), ветка `Markdown` (MAX, без экранирования спецсимволов, обычный `*bold*`, `_italic_`), ветка `HTML`.

## 2) Убрать опцию HTML в селекторе формата

**`src/components/builder/EditorPanel.tsx`** (строки ~309–318):
- Скрывать `<select>` целиком для `telegram`/`max` (там всегда соответствующий MarkdownV2/Markdown), либо оставить селектор отключённым с подписью текущего формата.
- Для `telegram`: жёстко `MarkdownV2`. Для `max`: жёстко `Markdown` (новое значение `parseMode`).

**`src/lib/message-builder.ts`**:
- Расширить тип `parseMode` до `'MarkdownV2' | 'Markdown' | 'HTML'`.
- В `buildMaxJson` `format` ставить `'markdown'` всегда (как и сейчас).
- В `prepareMarkdownV2` использовать только при `parseMode === 'MarkdownV2'` (Telegram). Для MAX (`Markdown`) — текст идёт «как есть», без экранирования.

**`src/contexts/MessageContext.tsx`**:
- При смене платформы устанавливать соответствующий `parseMode`: telegram→MarkdownV2, max→Markdown, html→HTML.

## 3) MAX test send через edge-функцию (фикс CORS)

Браузер не может вызывать `https://platform-api.max.ru` напрямую — нужен прокси.

**Новая edge функция `supabase/functions/max-send/index.ts`** (verify_jwt = false, CORS headers):
- POST вход: `{ token: string, userId: string, payload: any }`.
- Делает `fetch('https://platform-api.max.ru/messages?user_id=' + encodeURIComponent(userId), { method:'POST', headers:{ Authorization: token, 'Content-Type':'application/json' }, body: JSON.stringify(payload) })`.
- Возвращает `{ status, body }` клиенту.

**`supabase/config.toml`**: добавить блок для `max-send` с `verify_jwt = false`.

**`src/components/builder/JsonPanel.tsx`** (`handleTest`, ветка `!isTelegram`):
- Заменить прямой fetch на `supabase.functions.invoke('max-send', { body: { token, userId: message.chatId.trim(), payload: JSON.parse(body) } })`.
- Показывать toast в зависимости от `data.status` / `data.body`.

---

## Файлы

- `src/components/builder/EditorPanel.tsx`
- `src/contexts/MessageContext.tsx`
- `src/lib/message-builder.ts`
- `src/components/builder/JsonPanel.tsx`
- `supabase/functions/ai-message-editor/index.ts`
- `supabase/functions/max-send/index.ts` (новый)
- `supabase/config.toml`
