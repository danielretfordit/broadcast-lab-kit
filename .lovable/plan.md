## WhatsApp правки

**1) Размер иконки WhatsApp**
- `src/components/builder/PreviewPanel.tsx` (строка 206): `WhatsAppBrandIcon` `w-8 h-8` → `w-6 h-6`. Чтобы выровнять с круглой плашкой `w-7 h-7` других каналов.
- `src/components/builder/SaveAllTemplatesDialog.tsx` (строка 116): `WhatsAppBrandIcon` `w-7 h-7` → `w-6 h-6`. Иконка SVG плотнее и выглядит крупнее остальных в круглых плашках.

**2) Форматирование текста WhatsApp**
Стандарт: `*bold*`, `_italic_`, `~strike~`, `` `mono` `` (одинарные символы).

- `src/contexts/MessageContext.tsx`: в `defaultParseMode` для `'whatsapp'` возвращать `'Markdown'` (сейчас попадает в дефолт `'MarkdownV2'`). Добавить ветку и в `setPlatform`-блоке.
- `src/components/builder/EditorPanel.tsx` `insertFormatting`:
  - Добавить флаг `isWhatsAppSyntax = message.platform === 'whatsapp'`.
  - В ветке Markdown: для WhatsApp — `bold = *x*`, `italic = _x_`, `strikethrough = ~x~`, `mono = ` `` `x` `` `` (одинарные backticks, не тройные). Без `underline`.
- Тулбар форматирования: для WhatsApp показывать тот же набор, что у Viber (bold/italic/strike/mono), без link/quote/underline.
- Плашка справа от заголовка "Текст сообщения" (строка 423): для WhatsApp показывать `WhatsApp` (или `Markdown`).
- `PreviewPanel.tsx` `renderInline`: ветка Markdown для не-MAX уже корректно превращает `*x*→strong`, `_x_→em`, `~x~→s`. Проверить, что регексы не ломают сообщение (после смены parseMode на Markdown сработают). Дополнительно убедиться, что одиночные `` `x` `` рендерятся как `<code>` (уже есть строка 79).

**3) Заголовок JSON-панели**
- `src/components/builder/JsonPanel.tsx` (строка 200): добавить ветку `isWhatsApp` → `'(WhatsApp)'`. Завести `const isWhatsApp = message.platform === 'whatsapp';`.

**4) Footer в JSON-панели**
- `JsonPanel.tsx` (строка 299, 302): для WhatsApp:
  - левая часть: `Tyntec API • Markdown`
  - правая часть (метод/путь): `conversations/v3/messages`

**5) Настройки WhatsApp + тестовая отправка**

5a) `BotSettingsDialog.tsx`:
- Расширить `BotPlatform` на `'whatsapp'`.
- Добавить ключ для sender (`from`): `WA_SENDER_KEY = 'bot-settings:whatsapp:sender'`. Для `whatsapp` хранить отдельно `from` (sender), `to` (chatId) и `apikey` (token).
- В UI для `whatsapp`:
  - Поле "API Token (apikey)" — `password`.
  - Поле "Sender ID (from)" — text. Подсказка: «WABA номер отправителя».
  - Поле "Receiver ID (to)" — text/password. Подсказка: «Номер получателя в формате E.164 (без +)».
- Заголовок: `Настройки WhatsApp`.
- Подсказка для apikey: «Tyntec API key (apikey header)».
- Экспортировать `getWhatsAppSender()` (читает `WA_SENDER_KEY`).

5b) `JsonPanel.tsx`:
- Кнопка "Настройки" должна быть доступна для WhatsApp: убрать `disabled={isViber || isSms}` для случая whatsapp (оставить только для viber_business / sms).
- В `<BotSettingsDialog platform={...} />` пробросить `'whatsapp'` когда `isWhatsApp`.
- В `handleTest`: ветка `if (isWhatsApp)` — собрать payload (`buildWhatsAppJson` уже выдаёт правильную структуру), подменить `from`/`to` на значения из настроек, вызвать edge-функцию `whatsapp-send` через `supabase.functions.invoke('whatsapp-send', { body: { apikey: token, payload } })`. Тосты успеха/ошибки по аналогии с viber.

5c) Edge function `supabase/functions/whatsapp-send/index.ts`:
- Принимает `{ apikey, payload }`.
- POST на `https://api.tyntec.com/conversations/v3/messages`, заголовки `apikey: <token>`, `Content-Type: application/json`, тело — `payload` как есть.
- Возвращает `{ ok: res.ok, status: res.status, body: <json|text> }` с CORS.
- Без проверки JWT (`verify_jwt = false` в `supabase/config.toml` блок `[functions.whatsapp-send]`).
- Зарегистрировать секрет `TYNTEC_API_KEY` НЕ требуется (токен передаётся пользователем из UI).

**6) Иконки в "Сохранить все шаблоны" одинакового размера**

В `SaveAllTemplatesDialog.tsx` `PlatformIcon`:
- Все плашки имеют контейнер `w-7 h-7` круглый. Внутри — иконка ~`w-4 h-4`.
- Сейчас `viber_bot` рендерит `ViberBrandIcon className="w-7 h-7"` — без круглой подложки, иконка визуально крупнее.
- WhatsApp — то же.
- Сделать унифицированно: обернуть `ViberBrandIcon` и `WhatsAppBrandIcon` в `<div className="w-7 h-7 rounded-full bg-[colorBg]/15 flex items-center justify-center">` и иконка внутри `w-4 h-4` цветом бренда. Либо проще: задать всем брендовым SVG `w-4 h-4` в круглой подложке как у Telegram/MAX (фон в фирменном цвете светлый/насыщенный — для единообразия использовать насыщенный, чтобы белые/контурные SVG читались, либо оставить контурные с легким фоном).
- Решение: круглый контейнер 7×7 с фоном `#7360F2` (Viber) / `#25D366` (WhatsApp), внутри иконка `w-4 h-4` цветом `white`. Это совпадает по визуалу с Telegram/MAX.

---

## Файлы

Изменить:
- `src/components/builder/PreviewPanel.tsx` — размер иконки WhatsApp.
- `src/components/builder/SaveAllTemplatesDialog.tsx` — единые иконки 7×7 в круге.
- `src/components/builder/JsonPanel.tsx` — заголовок "(WhatsApp)", footer Tyntec API, ветка `handleTest` для WhatsApp, прокинуть platform в settings.
- `src/components/builder/BotSettingsDialog.tsx` — поддержка `whatsapp` (apikey + from + to), экспорт `getWhatsAppSender`.
- `src/components/builder/EditorPanel.tsx` — `insertFormatting` для WhatsApp, тулбар (bold/italic/strike/mono), плашка parse-mode.
- `src/contexts/MessageContext.tsx` — `defaultParseMode('whatsapp') = 'Markdown'`.
- `supabase/config.toml` — блок `[functions.whatsapp-send] verify_jwt = false`.

Создать:
- `supabase/functions/whatsapp-send/index.ts` — proxy к `https://api.tyntec.com/conversations/v3/messages`.
