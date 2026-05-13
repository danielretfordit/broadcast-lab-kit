## Доп. правки превью Viber Business / SMS

### 1) `src/components/builder/PreviewPanel.tsx`
- Завести флаги по маршруту:
  - `route = message.viberRoute || 'viber(60)-sms'`
  - `routeHasSms = route.includes('sms')` (true для `viber(60)-sms`, `viber(30)-sms`, `sms-only`)
  - `routeHasViber = route.startsWith('viber')` (true для всех, кроме `sms-only`)
- Блок Viber-превью (карточка с медиа/текстом/кнопками + строка "API Method") рендерим только если `!isViber || routeHasViber`. Для `sms-only` его не показываем.
- Блок SMS-фолбэка (`isViber && (() => …)()`) рендерим только при `routeHasSms`. Для `viber-only` его скрываем.
- Для `sms-only` шапку "Viber Business / SMS Preview" оставляем (это заголовок раздела), а в footer-подписи API Method заменяем на `Provider · route: sms-only`.

### 2) `src/components/builder/PreviewPanel.tsx` — валидация сохранения
- Скорректировать `emptyTemplate` для Viber:
  - `viber-only` → блокировать только если пустой `text`.
  - `sms-only` → блокировать только если пустой `smsText`.
  - маршруты с обоими каналами → как сейчас (нужен либо `text`, либо `smsText`; уже есть `textEmpty && smsEmpty`).

### 3) `src/lib/message-builder.ts` — `buildViberJson`
Изменить структуру в зависимости от маршрута:

- Если `route === 'sms-only'` — отдавать строго:
  ```json
  {
    "login": "******",
    "password": "******",
    "phones": "<phone>",
    "message": "<smsText>",
    "route": "sms",
    "rus": "1"
  }
  ```
  Поле `message` берётся из `msg.smsText`. Никаких `param_sms`, `image_url`, `btn_url`, `btn_name`.
- Если `route === 'viber-only'` — оставить текущую структуру, но без `param_sms` (SMS-фолбэка нет).
- Иначе (`viber(60)-sms`, `viber(30)-sms`) — текущая структура с `param_sms`.

### 4) `src/components/builder/EditorPanel.tsx` — UX-правки под маршрут (минимально)
- Для `sms-only` секция «Текст сообщения / медиа / кнопка» Viber не нужна как обязательная — `routeNeedsSms` уже включает SMS-секцию. Дополнительно: при `sms-only` скрывать секции «Медиа контент» и inline-кнопку Viber, оставлять только маршрут + SMS-блок (тулбар/textarea для основного текста тоже скрыть, т.к. `message` для sms-only берётся из `smsText`).
- Для `viber-only` — скрывать SMS-секцию (уже сделано через `routeNeedsSms`).

### Файлы
- `src/components/builder/PreviewPanel.tsx`
- `src/lib/message-builder.ts`
- `src/components/builder/EditorPanel.tsx`

Без изменений в схеме БД, контексте сообщения и edge-функциях.
