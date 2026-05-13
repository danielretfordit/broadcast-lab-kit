## Добавление SMS как отдельного канала (шаблона)

Канал `SMS` становится самостоятельной платформой (как Telegram/MAX/Viber/Email), а не подрежимом Viber. У него простой редактор (только поле SMS), простое превью (SMS-блок), JSON в одно поле `message`. AI-редактор отсутствует. Отображается с пиктограммой монет (платный канал).

### 1. Типы и билдеры — `src/lib/message-builder.ts`
- Расширить `Platform`: `'telegram' | 'max' | 'html' | 'viber' | 'sms'`.
- Добавить `buildSmsJson(msg)` → `{ message: msg.smsText || msg.text || '' }` (одно поле).
- Добавить `parseSmsJson(parsed)` → `{ text: '', smsText: parsed.message, mediaType:'none', mediaUrl:'', mediaUrls:[], buttonRows:[] }`.
- Расширить `buildJson` и `parseJsonToMessage` для `'sms'`.

### 2. Контекст — `src/contexts/MessageContext.tsx`
- В `defaultParseMode` и в миграции `loadDraft` добавить ветку `sms` → `parseMode: 'Markdown'` (формально, не используется).

### 3. Хедер вкладок — `src/components/builder/AppHeader.tsx`
- Добавить в массив `platforms` запись:
  ```ts
  { id: 'sms', label: 'SMS', CustomIcon: SmsIcon, iconColor: '#6B7280', iconClassName: 'w-4 h-4', paid: true }
  ```
- Убрать `sms` из списка disabled-каналов внизу.
- В `Index.tsx` функцию `isPlatform` дополнить `v === 'sms'`.

### 4. Редактор — `src/components/builder/EditorPanel.tsx`
- Добавить флаг `const isSms = message.platform === 'sms'`.
- Если `isSms`: рендерить ТОЛЬКО секцию SMS-инпута со счётчиком символов (тот же UI, что уже используется в Viber-SMS fallback: textarea + `smsParts()` + tone + ошибка «укажите текст SMS»).
- Скрыть для `isSms`: маршрут Viber, медиа-секцию, форматтер, основное textarea, AI-кнопку, inline-кнопки.

### 5. Превью — `src/components/builder/PreviewPanel.tsx`
- Добавить `const isSms = message.platform === 'sms'`.
- При `isSms`:
  - В шапке заголовок «SMS Preview», иконка `MessageSquare` на сером фоне.
  - Рендерить только тот же SMS-блок, что для Viber-SMS (со счётчиком и кодировкой). Источник текста — `message.smsText`.
  - Валидация: `emptyTemplate = !message.smsText?.trim()`. Скрыть `mediaInvalid`, кнопки.
  - `platformLabel = 'SMS'`.

### 6. Save-All диалог — `src/components/builder/SaveAllTemplatesDialog.tsx`
- В `PLATFORMS` добавить `{ key: 'sms', label: 'SMS' }`.
- В `PlatformIcon` добавить ветку для `sms` (та же `SmsIcon` или `MessageSquare` на нейтральном фоне).
- В `isFilled` для `sms` вернуть `!!(m.smsText?.trim())`.
- В `buildFor` для `sms` вызвать `buildSmsJson`.
- Включить `sms: true` в дефолтном `selected` и в загрузке черновиков (`loadDraft('sms')`).
- Рядом с лейблами платных каналов (Viber Business / SMS, SMS) добавить пиктограмму монет (`<Coins size={12} className="text-amber-500/80" />`).

### 7. View mode (`?mode=view&channel=sms`)
- Не требует отдельных правок — `ViewOnlyPage` использует `PreviewPanel`, который уже знает про `sms`. `parseJsonToMessage` распарсит `{message:"..."}` в `smsText`.

### Итоговые файлы
- `src/lib/message-builder.ts`
- `src/contexts/MessageContext.tsx`
- `src/components/builder/AppHeader.tsx`
- `src/components/builder/EditorPanel.tsx`
- `src/components/builder/PreviewPanel.tsx`
- `src/components/builder/SaveAllTemplatesDialog.tsx`
- `src/pages/Index.tsx`
