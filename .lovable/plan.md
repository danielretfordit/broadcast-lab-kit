
# План доработок CRM Ads Конструктор

## 1. URL-параметры для режима и канала

Расширить роутинг `src/pages/Index.tsx` и `ViewOnlyPage.tsx` для чтения параметров:

- `?mode=view` — режим просмотра (уже есть)
- `?type=marketing|transactional` — фиксирует верхний режим (вкладки заблокированы, активна только переданная)
- `?channel=telegram|max|html` — фиксирует канал (под-вкладки заблокированы, активен только переданный)
- Если параметры не переданы — всё доступно (как сейчас)

В `ViewOnlyPage.tsx` тот же `?channel=` определяет, какое превью показывать (Telegram/MAX/HTML iframe).

`AppHeader.tsx`: для заблокированных вкладок добавить визуальное состояние `disabled` (opacity, cursor-not-allowed) и `pointer-events: none`.

## 2. Сброс кэша / draft

Текущая проблема: `MessageContext` всегда восстанавливает draft из `localStorage`, что мешает при смене URL и приводит к рассинхрону.

Решение:
- Добавить ключ кэша с учётом `channel` (например `omni-builder-draft:${channel}`), чтобы шаблоны разных каналов не перетирали друг друга.
- В `Index.tsx` при наличии URL-параметров `type`/`channel` перезаписывать `message.platform` принудительно при монтировании.
- Добавить кнопку «Сбросить» в `AppHeader` (иконка-trash рядом с режимами), которая очищает draft текущего канала и пересоздаёт пустое сообщение.
- В `ViewOnlyPage` НЕ читать localStorage — всегда стартовать с пустого состояния и наполнять через будущий API (TODO уже есть).

## 3. Email-канал: переименование + поле «Тема»

- В `AppHeader.tsx`: переименовать вкладку `HTML` → `Email` (id канала остаётся `html`, чтобы не ломать существующую логику; меняется только label и иконка → `Mail`).
- В `MessageData` (`src/lib/message-builder.ts`) добавить поле `subject: string`.
- В `EditorPanel.tsx` для `isHtml`: над HTML-редактором добавить поле «Тема письма» (input).
- В `buildJson` для канала html сделать отдельную ветку (новая функция `buildEmailJson`):
  ```
  { subject, html, format: 'html' }
  ```
  Сейчас для html JSON-панель скрыта — оставить скрытой в UI, но JSON всё равно строить (для тестирования и будущего API).
- `parseJsonToMessage`: добавить обработку email JSON.

## 4. Цитата (blockquote) для Telegram

В `EditorPanel.tsx` в массив кнопок форматирования добавить кнопку `Quote` (иконка `Quote` из lucide):
- MarkdownV2 (Telegram): обернуть выделенные строки префиксом `> ` на каждой строке (стандарт Telegram MarkdownV2 для expandable quote — `**>` опционально пропускаем, базовый `>` достаточно).
- HTML parse_mode: `<blockquote>текст</blockquote>`.
- MAX: тот же `> ` на каждой строке.

В `PreviewPanel.tsx` `renderText` добавить рендер строк, начинающихся с `&gt; ` или `> `, в `<blockquote class="border-l-2 border-primary pl-2 text-muted-foreground">…</blockquote>`.

## 5. Исправление AI для HTML — параметр `parse_mode`

Сейчас `EditorPanel.handleAiHtml` шлёт корректный body (`prompt`, `currentHtml`), а edge function не использует `parse_mode`. Проблема: после генерации текст уходит в `message.text`, а `message.parseMode` остаётся прежним (`MarkdownV2`), что путает превью/JSON.

Исправление:
- В `handleAiHtml` после `updateField('text', data.html)` дополнительно `updateField('parseMode', 'HTML')`.
- При переключении канала на `html` автоматически выставлять `parseMode = 'HTML'` в `setPlatform` (`MessageContext.tsx`).

## 6. Валидация медиа

В `EditorPanel.tsx` (или `buildJson`/превью) показывать ошибку, когда выбран `mediaType !== 'none'`, но `mediaUrl` пуст:
- Под полем URL красная подсказка «Укажите ссылку на {фото|видео|файл}».
- Кнопка «Сохранить в проект» / «Тестировать» становится неактивной.
- В `JsonPanel` показывать предупреждение и не блокировать копирование, но подсветить.

## 7. Настройки бота (модальное окно) + кнопка «Тестировать»

Под `JsonPanel` добавить компактную панель с двумя «незаметными» иконками-кнопками (внизу, тонкая полоса):

```text
[⚙ Настройки]                                    [▶ Тестировать]
```

### Модалка настроек (`BotSettingsDialog.tsx`)
- Поле «Bot Token» (Telegram): input type=password.
- Заглушка для MAX (поле «Access Token», disabled с пометкой «скоро»).
- Хранение: только `sessionStorage` (ключ `bot-settings:telegram`), очищается при закрытии вкладки. Никогда не пишем в localStorage и не отправляем на сервер.
- Кнопки «Сохранить» / «Очистить».

### Кнопка «Тестировать»
- Доступна только для `telegram` (для `max` — disabled с tooltip «скоро»).
- Проверяет: токен задан, JSON валиден, `chatId` задан, при наличии media — `mediaUrl` не пуст.
- Определяет метод по JSON: `sendMessage` / `sendPhoto` / `sendVideo` / `sendDocument`.
- POST напрямую на `https://api.telegram.org/bot{TOKEN}/{method}` с телом из JSON-панели (текущий `jsonText` если в edit-режиме, иначе сгенерированный).
- Показывает toast: success с `message_id`, либо error с `description` от Telegram.
- Никаких edge-функций — токен не уходит из браузера.

## Технические детали

### Файлы для изменения
- `src/lib/message-builder.ts` — добавить `subject`, `buildEmailJson`, `parseEmailJson`, обновить типы.
- `src/contexts/MessageContext.tsx` — кэш по каналу, авто-`parseMode=HTML` для html, метод `resetDraft()`.
- `src/pages/Index.tsx` — чтение `type`/`channel` из URL, передача `lockedMode`/`lockedChannel` в header, форс-применение к `message.platform`.
- `src/components/builder/AppHeader.tsx` — `lockedMode`/`lockedChannel` пропсы, переименование HTML → Email, иконка сброса.
- `src/components/builder/EditorPanel.tsx` — поле «Тема», кнопка blockquote, валидация media-URL, `parseMode=HTML` после AI HTML.
- `src/components/builder/PreviewPanel.tsx` — рендер blockquote, отображение `subject` для email.
- `src/components/builder/JsonPanel.tsx` — нижняя полоса с двумя иконками (Settings, Play).
- `src/components/builder/BotSettingsDialog.tsx` — НОВЫЙ, на shadcn `Dialog`, sessionStorage.
- `src/components/builder/ViewOnlyPage.tsx` — учёт `?channel=`, не читать localStorage.

### Структура URL (итог)
```
/                                                         — всё доступно
/?type=marketing                                          — заблокировано marketing
/?type=marketing&channel=telegram                         — заблокировано всё, только telegram
/?mode=view&channel=html&guid=…                           — просмотр email-шаблона
```

### Безопасность
- Bot token только в `sessionStorage` (живёт до закрытия вкладки).
- Никаких сетевых отправок токена кроме прямого вызова `api.telegram.org`.
- Предупреждение в модалке: «Токен хранится только в этой вкладке браузера и очищается при закрытии».

### Не входит в этот этап
- Реальная загрузка шаблона в `ViewOnlyPage` по GUID (остаётся TODO).
- Полноценный токен MAX для теста (заглушка disabled).
- Сохранение настроек на бэкенде.
