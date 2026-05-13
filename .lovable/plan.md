## Цель

1) UI-доработка хедера каналов (пиктограммы 24ч, размер SMS-иконки).
2) Полноценная реализация нового канала **Viber Bot** (chatapi.viber.com), отдельно от уже существующего «Viber Business / SMS». Внутреннее переименование.

---

## 1. Хедер каналов (`AppHeader.tsx`)

- Пиктограмма «24h» добавляется к заблокированным кнопкам **Viber** (личный) и **WhatsApp**, означает «окно 24 часа после диалога».
  - Используем lucide `Clock` + надпись `24h` в маленьком badge (`px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 text-[9px] font-bold`), показываем рядом с замком; в Tooltip пишем «Можно отправлять сообщения только в течение 24 часов после последнего сообщения пользователя».
- Иконка SMS (`SmsIcon`): сейчас рендерится `w-4 h-4`. Поднимаем до `w-5 h-5` (как `ViberBusinessIcon`) и в массиве `platforms` ставим `iconClassName: 'w-5 h-5'`. Цвет оставляем серым.

---

## 2. Переименование текущего «viber» → `viber_business` и добавление `viber_bot`

### `src/lib/message-builder.ts`
- Тип:
  ```ts
  export type Platform = 'telegram' | 'max' | 'html' | 'viber_business' | 'sms' | 'viber_bot';
  ```
- Везде, где было `'viber'`, заменить на `'viber_business'`: `buildJson`, `parseJsonToMessage`, `buildViberJson` (renamed → `buildViberBusinessJson`, оставить алиас экспорта `buildViberJson` для совместимости импорта в `SaveAllTemplatesDialog`, либо обновить импорты).
- Добавить:
  ```ts
  export interface MessageData { ...
    viberBotSenderName?: string;
    viberBotTrackingData?: string;
  }
  export function buildViberBotJson(msg): object;
  export function parseViberBotJson(parsed): Partial<MessageData>;
  ```
  JSON соответствует образцу (`receiver`, `min_api_version`, `sender.name`, `tracking_data`, `text`, `type`, `media`). Поле `type` определяется из `mediaType`: `none`→`text`, `photo`→`picture`, `video`→`video`, `document`→`file`. Кнопки пока не обрабатываются.

### `src/contexts/MessageContext.tsx`
- `defaultParseMode`: добавить `viber_bot` → `'Markdown'`. Заменить `'viber'` → `'viber_business'` в `loadDraft` и в forced parseMode.
- Миграция localStorage: при загрузке ключа `omni-builder-draft:viber` (если есть) — перенести в `omni-builder-draft:viber_business` и удалить старый.

### `src/pages/Index.tsx`
- `isPlatform`: добавить `viber_business`, `viber_bot`. Также поддержать обратную совместимость URL-параметра `&channel=viber` → маппинг в `viber_business`; добавить `&channel=viber_bot`.

### `AppHeader.tsx`
- В массиве `platforms`: переименовать существующий `id: 'viber'` → `id: 'viber_business'` (label остаётся «Viber Business / SMS»).
- Заменить заблокированную кнопку `viber-personal` на активную вкладку **Viber** с `id: 'viber_bot'` (CustomIcon = `ViberBrandIcon`, цвет `#7360F2`, paid: true, добавить иконку монет как у других платных). В заблокированных оставляем только WhatsApp с пиктограммой 24h.

### `EditorPanel.tsx`, `PreviewPanel.tsx`, `JsonPanel.tsx`
- Заменить везде `message.platform === 'viber'` → `'viber_business'`. Добавить новый признак `isViberBot = message.platform === 'viber_bot'`.
- В `EditorPanel`:
  - Для `isViberBot` показываем тот же набор контролов что для `viber_business`, но **без** селектора маршрута и **без SMS-блока**. Медиа-типы: `none / photo / video / document` (без альбома, без кнопок). Форматирование текста — как у Viber Business (bold/italic/strike/mono, parseMode Markdown).
  - AI-редактор оставляем доступным как для остальных мессенджеров.
- В `PreviewPanel`:
  - Для `isViberBot` рендерим обычный «чат-бабл» как у viber_business, без SMS-блока. Лейбл `platformLabel` = «Viber». Аватар: фиолетовый круг с `ViberBrandIcon`. API Method блок: `POST chatapi.viber.com/pa/send_message`, parseMode Markdown.
- В `JsonPanel`:
  - Заголовок `JSON (Viber Bot)`. Footer — `Viber REST API • Markdown` / `pa/send_message`. Кнопки **Настройки** и **Тестировать** активны (см. п.5).

### Валидация (PreviewPanel + EditorPanel)
- Аналог `viber_business` без SMS: `emptyTemplate = textEmpty && !hasValidMedia`. `mediaInvalid` — только проверка `mediaUrl` (альбома нет).

---

## 3. Сохранение коллекции (`SaveAllTemplatesDialog.tsx`)

- Добавить запись в `PLATFORMS`: `{ key: 'viber_bot', label: 'Viber', paid: true }` (со своим `PlatformIcon` — фиолетовый круг + ViberBrandIcon).
- Переименовать ключи `viber` → `viber_business` во всём файле.
- `isFilled` для `viber_bot`: `text.trim()` обязателен; если `mediaType !== 'none'` — `mediaUrl.trim()` обязателен.
- `buildFor` → ветка `viber_bot` использует `buildViberBotJson`.
- Итоговая коллекция отправляется тем же `POST /api/saveTemplate/?guid=...` — ключ в объекте `collection['viber_bot']`.

---

## 4. View Only mode

`ViewOnlyPage.tsx` ничего менять не нужно — он просто рендерит `PreviewPanel`. Проверим, что `parseJsonToMessage` корректно роутит на `parseViberBotJson` для `platform === 'viber_bot'`.

---

## 5. Модалка настроек и тестирование Viber Bot

### `BotSettingsDialog.tsx`
- Расширить тип `platform` до `'telegram' | 'max' | 'viber_bot'`.
- Хранение в `sessionStorage`:
  - `bot-settings:viber_bot` → token (`X-Viber-Auth-Token`)
  - `bot-settings:viber_bot:sender` → имя бота
  - `bot-settings:chatId:viber_bot` → ID получателя
- Поля формы для viber_bot: **Auth Token**, **Sender name**, **Receiver ID**. Подсказки: «Токен из кабинета Viber for Business», «Имя бота, которое увидит получатель», «service_user_id (Base64) подписчика».
- Экспортировать вспомогательные геттеры `getViberBotSender(): string | null`.

### `JsonPanel.tsx`
- `isViberBot` → активируем `Настройки` и `Тестировать` (убрать `disabled` для Viber Bot, оставить блок только для `viber_business` и `sms`).
- `handleTest` для `viber_bot`:
  - Берём `token`, `sender`, `receiver` из настроек, валидируем.
  - Парсим текущий JSON (editMode/generated) → подставляем `receiver` и `sender.name` из настроек поверх значений шаблона.
  - Вызываем edge function `viber-send` (новая, см. ниже) — прямой `fetch` к `chatapi.viber.com` нельзя из браузера из-за CORS.
  - Тост успеха/ошибки на основе `status` и `status_message` из ответа Viber.

### Новая edge function `supabase/functions/viber-send/index.ts`
- Принимает `{ token, payload }`. Делает `POST https://chatapi.viber.com/pa/send_message` с заголовком `X-Viber-Auth-Token` и телом `payload`. Возвращает `{ ok, status, body }`. CORS-заголовки. `verify_jwt = false` в `supabase/config.toml`.

---

## 6. Документация миграции

- Старый ключ localStorage `omni-builder-draft:viber` мигрируется в `:viber_business` при первой загрузке (см. п.2). Старые URL `?channel=viber` маппятся в `viber_business` для обратной совместимости.

---

## Технические детали

- Все строки `'viber'` будут найдены поиском и заменены: `EditorPanel.tsx`, `PreviewPanel.tsx`, `JsonPanel.tsx`, `SaveAllTemplatesDialog.tsx`, `MessageContext.tsx`, `Index.tsx`, `message-builder.ts`, `lib/sms.ts` (если встречается).
- `buildViberBotJson` минимальный (без кнопок) — ровно по образцу из ТЗ.
- Модальное окно подтверждения шаблонов уже использует `Coins` для платных каналов — `viber_bot` помечается как `paid: true`, иконка монет появится автоматически.
- Иконку 24h делаем компактным компонентом, чтобы переиспользовать на WhatsApp и (при необходимости) других каналах в будущем.

