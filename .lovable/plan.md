## Опциональные поля в Viber JSON

**Файл: `src/lib/message-builder.ts` — `buildViberJson`**

Для роутов `viber-only` и `viber(60)-sms` добавлять поля `image_url`, `btn_url`, `btn_name` в JSON только если они непустые:

- `image_url` — добавляется только если `msg.mediaUrl` не пуст
- `btn_url` — только если у первой кнопки есть `url`
- `btn_name` — только если у первой кнопки есть `text`

Пустые строки в JSON больше не выводятся.

**Проверка mode=view (Viber Business / SMS)**

`ViewOnlyPage` использует общий `buildJson` и `PreviewPanel`, отдельной ветки для Viber там нет — изменение в `buildViberJson` автоматически отразится и на режиме просмотра. Дополнительных правок не требуется.

**Файлы:** `src/lib/message-builder.ts`.
