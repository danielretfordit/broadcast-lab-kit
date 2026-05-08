## Изменения

### 1) Перенос Chat ID в настройки тестовой отправки

**`src/components/builder/EditorPanel.tsx`** — удалить блок «Chat ID» (строки 292–304). Логика JSON не зависит от UI этого поля (в `buildJson` `chat_id` не пишется), поэтому сборка JSON остаётся без изменений.

**`src/components/builder/BotSettingsDialog.tsx`** — добавить поле «Chat ID для теста»:
- Хранить в `sessionStorage` по ключу `bot-settings:chatId:<platform>`.
- Экспортировать `getTestChatId(platform)` рядом с `getBotToken`.
- Поле подписать: для Telegram — «Chat ID», для MAX — «Chat ID (user_id для теста)».

**`src/contexts/MessageContext.tsx`** — поле `chatId` остаётся в `MessageData` (используется в `handleTest`), но теперь синхронизируется из настроек: при открытии/использовании теста `JsonPanel` подставляет `chatId` из `getTestChatId`.

**`src/components/builder/JsonPanel.tsx`** (`handleTest`):
- Брать `chatId` через `getTestChatId(platformKey)` вместо `message.chatId`.
- Если пусто — `toast.error` и открыть `BotSettingsDialog`.
- Удалить зависимость от `message.chatId` для валидации.

### 2) Спиннер при сохранении шаблона

**`src/components/builder/PreviewPanel.tsx`** (`handleSaveToProject`, кнопка «Сохранить в проект»):
- Добавить `const [saving, setSaving] = useState(false)`.
- Обернуть запрос в `try/finally` с `setSaving(true/false)`.
- В кнопке: `disabled={saveDisabled || saving}`, иконка — `<Loader2 className="animate-spin" />` пока `saving`, иначе `<Save />`. Текст: «Сохранение...» / прежний текст.

### 3) Заблокированные каналы в шапке

**`src/components/builder/AppHeader.tsx`** (массив `platforms` и рендер табов каналов):
- После Email добавить четыре «disabled» кнопки: Viber, Viber Business, WhatsApp, SMS.
- Использовать иконки `lucide-react`: `MessageCircle` (Viber), `Briefcase` (Viber Business), `MessageSquare` (WhatsApp), `Smartphone` (SMS).
- На каждой кнопке: иконка канала + маленькая `Lock` (замочек) + `Coins` (монетка, платный канал) в правом верхнем углу.
- Стили: серый фон (`bg-muted/40 text-muted-foreground/50`), `cursor-not-allowed`, `disabled`, без обработчика клика.
- Тултип «В разработке • Платный канал».

### Технические детали

- `chatId` остаётся в типе `MessageData`, но больше не отображается в редакторе. Это не нарушает контракт `buildJson`, т.к. он не использует `chatId` (только `handleTest`).
- В `JsonPanel.handleTest` источник `chatId` меняется с `message.chatId` на `sessionStorage`-значение через `getTestChatId(platform)`.
- Новые кнопки каналов чисто декоративные — никакой `Platform` тип не расширяется.

### Файлы

- `src/components/builder/EditorPanel.tsx`
- `src/components/builder/JsonPanel.tsx`
- `src/components/builder/BotSettingsDialog.tsx`
- `src/components/builder/PreviewPanel.tsx`
- `src/components/builder/AppHeader.tsx`
