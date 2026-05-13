## Правки Viber

**1) Цвет текста кнопок Viber клавиатуры — по умолчанию чёрный**
- В `EditorPanel.tsx` мини-тулбар форматирования кнопок: убрать дефолтный `<font color="#FFFFFF">`. Чёрный — без обёртки. При клике "белый цвет" вставляется `<font color='#FFFFFF'>...</font>`, при "чёрный" — снимать обёртку или вставлять `<font color='#000000'>`.
- В `PreviewPanel.tsx` (`renderViberBtnText`): дефолтный цвет текста — `#000000` если не задан `<font color>`.

**2) Переделать структуру форматирования `<font>` в кнопках Viber**
Правильный формат: `<font size='24' color='#FFFFFF'><b>ТЕКСТ</b></font>` (атрибуты в одинарных кавычках, оба внутри одного тега `<font>`).
- В `EditorPanel.tsx` тулбар форматирования кнопки изменить так, чтобы был ОДИН блок управления для выделенного фрагмента: галочки/инпуты для color, size, и кнопки B/I, которые оборачивают выделение в `<font size='N' color='#HEX'><b>...</b></font>` единым тегом.
- Кнопка "Применить форматирование" собирает результат: если задан только bold — `<b>x</b>`, если задан size/color — оборачивает в `<font ...>`. Атрибуты — одинарные кавычки.
- Парсер в превью (`renderViberBtnText`) уже поддерживает оба варианта (одинарные/двойные кавычки) — проверить и добавить regex для одинарных кавычек если не работает.

**3) `min_api_version: 4`**
- В `buildViberBotJson` (`message-builder.ts`) изменить `min_api_version: 1` → `min_api_version: 4`.
- В `parseViberBotJson` принимать любое значение.

---

## Новый раздел WhatsApp (платформа `whatsapp`)

**Разблокировать кнопку платформы WhatsApp** (в `AppHeader.tsx` или там где `disabled` для whatsapp).

**A) Типы и модель данных (`message-builder.ts`)**
- Добавить `'whatsapp'` в `Platform` union.
- Новые типы для WhatsApp кнопок reply:
  ```ts
  export interface WhatsAppReplyButton { id: string; title: string; payload: string; }
  export interface WhatsAppInteractive {
    header: string;     // text
    body: string;       // text (mandatory)
    footer: string;     // text
    buttons: WhatsAppReplyButton[]; // max 3
  }
  ```
- В `MessageData` добавить опциональные `whatsappInteractive?: WhatsAppInteractive`, `whatsappFilename?: string`.
- Поддерживаемые медиа: `none | photo | video | document` (без album).

**B) Build/Parse JSON**
Добавить `buildWhatsAppJson(msg)` со структурой:
```
{ from: "*****", to: "<service_user_id>", channel: "whatsapp", content: { ... } }
```
Где `content`:
- Если есть кнопки (interactive с buttons заполнены и есть body): `contentType: "interactive"`, `interactive: { subType: "buttons", components: { header: {type:"text", text}, body: {type:"text", text}, footer: {type:"text", text}, buttons: [{type:"reply", reply:{payload, title}}] } }`. Header/footer добавляются только если непустые.
- Иначе если есть фото: `contentType: "image", image: { caption, url }`.
- Иначе видео: `contentType: "video", video: { caption, url }`.
- Иначе документ: `contentType: "document", document: { url, caption, filename }`.
- Иначе: `contentType: "text", text: msg.text`.

`parseWhatsAppJson(parsed)` — обратное преобразование.

Включить в `buildJson` и `parseJsonToMessage`.

**C) Форматирование текста (тулбар)**
В `EditorPanel.tsx` для платформы `whatsapp`:
- Bold: `*текст*`
- Italic: `_текст_`
- Strikethrough: `~текст~`
- Code: `` `текст` `` (одинарные backticks для inline; для блоков — три)
Использовать `parseMode = 'Markdown'` (или новый режим `'WhatsApp'` — но Markdown с правильными wrappers достаточно: добавить ветку `isWhatsApp` в `insertFormatting`).

**D) Редактор (как Viber bot, но проще)**
- Один URL картинки/видео/документа (без album).
- Поле "Имя файла" (filename) для documents.
- Текст (caption или text). Для interactive это `body`.
- Поля `Header text` (опционально, до 60 chars), `Footer text` (опционально, до 60 chars) — отображаются только когда добавлены кнопки.
- Список reply-кнопок (max 3): редактор `title` (до 20 chars), `payload`.
- Если кнопки добавлены — медиа недоступно (WhatsApp interactive buttons не поддерживают медиа в том же сообщении в этой структуре). Уточнение: header может быть только text, поэтому при наличии interactive buttons — медиа выключаем.

**E) Превью и list-view (`PreviewPanel.tsx`, `SaveAllTemplatesDialog.tsx`)**
- Иконка WhatsApp: классический зелёный логотип. Создать `src/components/icons/WhatsAppBrandIcon.tsx` (зелёный `#25D366`) — простой SVG в стиле Viber-иконки.
- Превью оформить как Viber (bot): пузырь сообщения с медиа сверху, текстом, и кнопками снизу.
- Если interactive buttons: рендер шапка (жирным), body, footer (мелкий серый), затем 3 кнопки-стека (как WhatsApp UI).
- Поддержать markdown WhatsApp: `*bold*`, `_italic_`, `~strike~`, `` `code` `` → HTML. Простая функция `renderWhatsAppText`.

**F) Валидация**
- body обязательный (для interactive — body mandatory).
- title кнопки ≤ 20 chars, header/footer ≤ 60 chars.
- Не более 3 кнопок.
- Если медиа выбрано — url обязателен.
- Predicate `isWhatsAppValid(msg)` для блокировки сохранения/отправки, как у других каналов.

**G) Save All Templates (`SaveAllTemplatesDialog.tsx`)**
- Добавить запись для канала WhatsApp по аналогии с Viber bot: иконка, плашка `24` (как Telegram/WhatsApp 24h окно), JSON.

**H) Отправка (Send/Test)**
- Реализовать как остальные мессенджеры. Создать edge function `whatsapp-send` (по образцу `viber-send/index.ts`). Endpoint: `https://api.tyntec.com/conversations/v3/messages`. Headers: `apikey: <TYNTEC_API_KEY>`, `Content-Type: application/json`. Body — JSON из `buildWhatsAppJson` с подстановкой реальных `from`/`to`.
- Секрет `TYNTEC_API_KEY` запросить через `secrets--add_secret`.

**I) Модальное окно настройки и тестирования WhatsApp**
По аналогии с Viber bot Settings (`BotSettingsDialog.tsx`):
- Поля: API Token (apikey), Sender ID (from), Receiver ID (to) — для тестирования.
- Кнопка "Тест": вызывает edge function `whatsapp-send` с текущим JSON.
- Подсказка Receiver ID — обезличенная (как у Viber bot), без реальных ID.
- Сохранять настройки в localStorage.

---

## Файлы

**Изменить:**
- `src/lib/message-builder.ts` — типы, build/parse WhatsApp, `min_api_version: 4`.
- `src/components/builder/EditorPanel.tsx` — Viber `<font>` тулбар, WhatsApp редактор, форматирование.
- `src/components/builder/PreviewPanel.tsx` — дефолтный чёрный цвет текста кнопок Viber, WhatsApp превью + иконка, рендер markdown.
- `src/components/builder/SaveAllTemplatesDialog.tsx` — добавить WhatsApp.
- `src/components/builder/AppHeader.tsx` — разблокировать WhatsApp.
- `src/components/builder/BotSettingsDialog.tsx` или новый `WhatsAppSettingsDialog.tsx` — настройки/тест.
- `src/contexts/MessageContext.tsx` — initial state для whatsapp полей.

**Создать:**
- `src/components/icons/WhatsAppBrandIcon.tsx`.
- `supabase/functions/whatsapp-send/index.ts`.

**Секреты:** `TYNTEC_API_KEY`.
