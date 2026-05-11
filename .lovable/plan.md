## Изменения

### 1) Корректное превью MAX-форматирования (PreviewPanel.tsx)

Добавить поддержку **заголовков** `# заголовок` (отдельная line-level обработка для MAX и Telegram), уточнить порядок подстановок и сохранить уже работающие правила:

В `renderText` (для `parseMode === 'Markdown'` и `'MarkdownV2'`):
- Перед группировкой строк по `>` (цитаты) выделять строки, начинающиеся с `# ` / `## ` / `### `, и оборачивать в `<h1/h2/h3>` со стилями (`text-lg font-bold`, и т.п.).
- В inline-обработке для MAX оставить порядок: ссылки → код → `**bold**` → `__bold__` → `++u++` → `~~s~~` → `*em*` → `_em_`.
- Для @упоминаний `[Имя](max://user/123)` — рендерить как обычную ссылку (без перехода), стиль primary-цвет.

Дополнительно в **EditorPanel** `insertFormatting`:
- Добавить кнопку «Заголовок» (`Heading` icon) — вставляет `# ` в начале строки.
- Подсказка-плейсхолдер для MAX: пример с `**жирный** *курсив* ++подчёркнутый++ ~~зачёркнутый~~ \`код\` # Заголовок > Цитата`.

### 2) Test send в Telegram использует Chat ID из настроек (JsonPanel.tsx)

Сейчас `body` берётся из `generatedJson`, в котором `chat_id` = `<CHAT_ID>` (поле в редакторе удалено). Перед отправкой:
- Для **Telegram**: `JSON.parse(body)` → `parsed.chat_id = testChatId` → отправлять.
- Для **Album** (`media[]`) `chat_id` тоже находится на верхнем уровне — тот же подход работает.
- Для **MAX**: `chat_id` уже передаётся через query параметр в edge функцию `max-send`, тут ничего менять не нужно.

### 3) Блокировка кнопки «Сохранить в проект» при пустом шаблоне (PreviewPanel.tsx)

Расширить `saveDisabled`:
- Для **HTML**: пустые `subject` ИЛИ `text` → disabled.
- Для **Telegram/MAX**: пустой `text` И отсутствует медиа (или альбом без валидных URL) → disabled. То есть шаблон считается «пустым», если нет ни текста, ни валидного медиа.
- Текущая проверка `mediaInvalid` сохраняется (нельзя сохранить с указанным типом медиа без URL).

Логика:
```ts
const textEmpty = !message.text.trim();
const hasValidMedia =
  (message.mediaType !== 'none' && message.mediaType !== 'album' && !!message.mediaUrl.trim()) ||
  (isAlbum && albumUrls.length >= 2);
const emptyTemplate = isHtml
  ? (!message.subject.trim() || textEmpty)
  : (textEmpty && !hasValidMedia);
const saveDisabled = mediaInvalid || emptyTemplate;
```

Текст кнопки/`title`:
- если `emptyTemplate` → «Заполните шаблон для сохранения»
- иначе если `mediaInvalid` → «Заполните медиа для сохранения»
- иначе «Сохранить в проект»

### Файлы

- `src/components/builder/PreviewPanel.tsx` — заголовки в превью + расширенная валидация.
- `src/components/builder/EditorPanel.tsx` — кнопка «Заголовок» в тулбаре, плейсхолдер для MAX.
- `src/components/builder/JsonPanel.tsx` — подмена `chat_id` из настроек при тестовой отправке Telegram.
