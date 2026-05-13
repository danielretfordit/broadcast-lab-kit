## Задачи

### 1) "Заголовок" (`#`) — только для MAX

**Файл:** `src/components/builder/EditorPanel.tsx`
- В тулбаре формата (массив с `bold/italic/.../heading/quote`) убирать кнопку `heading`, если `message.platform !== 'max'`.
- В placeholder для `textarea` убрать строку `# Заголовок` для Telegram (оставить только в подсказке для MAX).

**Файл:** `src/components/builder/PreviewPanel.tsx`
- В функции `renderText` блок группировки строк рендерит `# … ` как заголовок для любого markdown. Сделать рендер заголовков (`hMatch`) только при `message.platform === 'max'`. Для Telegram строки с `#` показывать как обычный текст.

### 2) Переименование "Viber Business" → "Viber Business / SMS" + рабочий канал

**Файл:** `src/components/builder/AppHeader.tsx`
- Удалить пункт `viber-business` из массива «disabled channels».
- Добавить новый активный канал в `platforms` массив: `{ id: 'viber', label: 'Viber Business / SMS', Icon: ViberIcon }` (или с `iconNode`, см. ниже про иконку). Чтобы сохранить совместимость с существующими `logo`, расширить тип элемента — поддержать `Icon: React.FC<{className?: string}>`.
- В рендере sub-tabs добавить ветку: если у платформы есть `Icon` (а не `logo`/`icon` от lucide), отрисовать SVG-иконку соответствующего размера (`w-4 h-4`).

### 3) Релевантная иконка Viber

**Файл:** `src/components/builder/AppHeader.tsx`
- Заменить текущий `ViberIcon` на узнаваемый «фиолетовый» вид (квадратная скруглённая плашка с трубкой). По умолчанию — `text-[#7360F2]` через CSS-переменную / Tailwind class на родителе. Иконка остаётся inline-SVG, цвет — через `currentColor`, чтобы для disabled-каналов (которые сейчас удаляются) логика не сломалась. На активной кнопке вкладки задать классу обёртки `text-[#7360F2]` (либо semantic token `--viber`, добавим в `index.css` и `tailwind.config.ts` как `viber: 'hsl(var(--viber))'`).

### 4) Новый канал Viber Business / SMS

#### 4.1 Расширение типа Platform

**Файл:** `src/lib/message-builder.ts`
- `export type Platform = 'telegram' | 'max' | 'html' | 'viber';`
- В `MessageData` добавить опциональные поля:
  - `smsText?: string` — текст SMS-фолбэка
  - `viberRoute?: string` — например `'viber(60)-sms'`, по умолчанию `viber(60)-sms`
  - `viberButtonText?: string`, `viberButtonUrl?: string` — одна кнопка
  - `viberImageUrl?: string` — одно изображение (используем существующий `mediaUrl` чтобы не плодить поля; решение — переиспользовать `mediaUrl` + `buttonRows[0].buttons[0]`, см. ниже).
- Решение: переиспользуем существующие поля
  - изображение → `message.mediaUrl` (тип `photo`)
  - кнопка → первая `buttonRows[0].buttons[0]` с `text` и `url`
  - добавляем только `smsText` и `viberRoute`.
- Новые builder/parser:
  ```ts
  export function buildViberJson(msg: MessageData): object {
    const btn = msg.buttonRows[0]?.buttons[0];
    return {
      login: '******',
      password: '******',
      phones: '<phone>',
      message: msg.text || '',
      route: msg.viberRoute || 'viber(60)-sms',
      param_sms: msg.smsText || '',
      rus: '1',
      image_url: msg.mediaUrl || '',
      btn_url: btn?.url || '',
      btn_name: btn?.text || '',
    };
  }
  export function parseViberJson(parsed): Partial<MessageData> { /* обратное */ }
  ```
  - В `buildJson`/`parseJsonToMessage` добавить ветку для `viber`.
  - `defaultParseMode` для `viber` → `'Markdown'` (формат провайдера допускает разметку — будем использовать те же правила, что и MAX, без `# heading`).

**Файл:** `src/contexts/MessageContext.tsx`
- В `defaultParseMode`/`loadDraft` добавить ветку `viber → 'Markdown'`.

**Файл:** `src/pages/Index.tsx`
- В `isPlatform` добавить `|| v === 'viber'`.

#### 4.2 Редактор Viber

**Файл:** `src/components/builder/EditorPanel.tsx`
- Добавить флаг `isViber = message.platform === 'viber'`.
- Раздел «Медиа контент» для viber: показывать только переключатель «Нет / Фото» (один URL), без альбома/видео/файла.
- Тулбар форматирования: показать те же кнопки, что для MAX **без** heading; форматтер `insertFormatting` для viber работает как для `max` (`**bold**`, `*italic*`, `++u++`, `~~s~~`, `[](url)`).
- Раздел «Кнопки»: ограничить одной кнопкой (одна строка, одна `InlineButton`, поля `text` + `url`). Скрыть `addButtonRow` / «добавить кнопку», если `isViber`.
- Новый блок «SMS-сообщение (фолбэк)»: `<textarea value={message.smsText}>` + счётчик символов в правом нижнем углу с цветовыми порогами:
  - 0–70 — 1 SMS (зелёный)
  - 71–134 — 2 SMS (warning)
  - 135–201 — 3 SMS (warning)
  - 202+ — N SMS (info)
  - Также показать текущую длину и лимит (`{n}/70 — {parts} SMS`).
  - Cyrillic берём как UCS-2 (70 за SMS); расчёт: `parts = ceil(len / 70)` если `len <= 70` — 1; `len > 70` — `ceil(len/67)`.
- Поле «Маршрут» (route) — простой `select`: `viber(60)-sms`, `viber(30)-sms`, `sms-only`, `viber-only` (по умолчанию первый).

#### 4.3 Превью Viber

**Файл:** `src/components/builder/PreviewPanel.tsx`
- Добавить ветку `isViber = message.platform === 'viber'`.
- Шапка превью: показать иконку Viber (`ViberIcon`, фиолетовый бэкграунд `bg-[#7360F2]` или viber token), `platformLabel = 'Viber Business / SMS'`.
- Карточка сообщения: одно изображение (если есть `mediaUrl`), текст сообщения (с тем же `renderText`, MAX-подобный markdown без heading), одна кнопка (если заполнена) — рисуем как ссылку.
- Под основной карточкой — отдельный блок «SMS-фолбэк»: серая карточка в стиле SMS, с моно-шрифтом, и счётчиком символов / частей справа сверху.
- `mediaInvalid` / `emptyTemplate` для viber:
  - `emptyTemplate = !message.text.trim() && !message.smsText?.trim()`
  - `mediaInvalid` — то же что у мессенджеров для одиночного фото.

#### 4.4 JSON-панель Viber

**Файл:** `src/components/builder/JsonPanel.tsx`
- Заголовок: `JSON (Viber/SMS)` для `viber`.
- Кнопка «Тестировать»: для MVP сделать disabled с тултипом «Тестовая отправка для Viber/SMS пока недоступна» (отправку не реализуем).
- `getTelegramMethod` не вызывать; футер для viber показать `Provider API • route: <route>`.

#### 4.5 SaveAllTemplatesDialog

**Файл:** `src/components/builder/SaveAllTemplatesDialog.tsx`
- Добавить четвёртую строку `viber` (label "Viber Business / SMS", Viber icon).
- В payload «json» добавить ключ `viber: <buildViberJson(draftViber)>` (если выбрано и не пусто). Filledness: `viber` filled если есть `text` или `smsText`.

#### 4.6 Локалсторадж/совместимость

- `loadDraft('viber')` использует тот же префикс, миграция полей не нужна — новые поля просто `undefined` для старых черновиков.
- Index в `BuilderLayout`: для viber правый JSON-панел тоже показываем (не `isHtml`), это уже работает.

### Технические заметки

- Счётчик SMS — отдельная утилитка `src/lib/sms.ts`:
  ```ts
  export function smsParts(text: string): { len: number; parts: number; encoding: 'GSM' | 'UCS2' } {
    const isUcs2 = /[^\u0000-\u007F]/.test(text);
    const len = text.length;
    if (!len) return { len: 0, parts: 0, encoding: isUcs2 ? 'UCS2' : 'GSM' };
    if (isUcs2) {
      const parts = len <= 70 ? 1 : Math.ceil(len / 67);
      return { len, parts, encoding: 'UCS2' };
    }
    const parts = len <= 160 ? 1 : Math.ceil(len / 153);
    return { len, parts, encoding: 'GSM' };
  }
  ```
- Тесты: добавить кейс в `src/test/message-builder.spec.ts` для `buildViberJson`.

### Файлы, которые будут изменены/созданы

- изменение: `src/lib/message-builder.ts`
- изменение: `src/contexts/MessageContext.tsx`
- изменение: `src/pages/Index.tsx`
- изменение: `src/components/builder/AppHeader.tsx` (иконка Viber, новый таб, удаление дубликата)
- изменение: `src/components/builder/EditorPanel.tsx` (heading только для MAX, viber-редактор, SMS-блок со счётчиком)
- изменение: `src/components/builder/PreviewPanel.tsx` (heading только для MAX, viber-превью, sms-карточка)
- изменение: `src/components/builder/JsonPanel.tsx` (поддержка viber)
- изменение: `src/components/builder/SaveAllTemplatesDialog.tsx` (4-я строка viber)
- новый: `src/lib/sms.ts`
- изменение: `src/test/message-builder.spec.ts` (тест buildViberJson)
