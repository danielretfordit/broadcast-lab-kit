## Правки Viber Business / SMS

**1) `src/components/builder/PreviewPanel.tsx`**
- Заменить заголовок `SMS-фолбэк` на `SMS` (строка 312).

**2) `src/lib/message-builder.ts` — `buildViberJson`**
- Для `viber-only`: в JSON передавать `route: "viber"` (а не `"viber-only"`). Остальные роуты остаются как есть (`viber(60)-sms`, `viber(30)-sms`, `sms` для sms-only).

**3) Удалить вариант `viber(30)-sms`**
- `EditorPanel.tsx` (строка 226) — убрать `<option value="viber(30)-sms">`.
- Поиском проверить остальные упоминания `viber(30)` и удалить (`message-builder.ts`, `PreviewPanel.tsx`, тесты при наличии).

**4) Названия роутов в выпадающем списке (`EditorPanel.tsx`)**
- Убрать слово `only` в подписях (значения `value` оставить прежними, чтобы не ломать сохранённые черновики):
  - `viber(60)-sms — Viber, через 60 сек SMS` (без изменений)
  - `viber-only` → label `viber — только Viber`
  - `sms-only` → label `sms — только SMS`
- В `PreviewPanel` футере (`API Method`) при отображении маршрута для `viber-only` показывать `viber`, для `sms-only` — `sms`.

**5) Валидация в `SaveAllTemplatesDialog.tsx` (`isFilled` для `viber`)**
Сейчас для `viber` достаточно `text` ИЛИ `smsText`. Заменить на проверку по роуту:
- `sms-only` → требуется `smsText`
- `viber-only` → требуется `text` (и медиа, если выбрано — текущая mediaInvalid логика уже работает; для sms-only/viber без медиа учитывать `routeHasViber`)
- `viber(60)-sms` → требуется `text` и `smsText` (соответствует «полностью заполненному» шаблону для коллекции; чекбокс будет неактивен и статус «Пусто», пока оба поля не заполнены)
- Также пропускать проверку медиа, если роут `sms-only` (там медиа не используется).

Файлы: `PreviewPanel.tsx`, `EditorPanel.tsx`, `message-builder.ts`, `SaveAllTemplatesDialog.tsx`.
