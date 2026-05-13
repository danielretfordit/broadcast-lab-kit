## Правки

### 1 + 4. Валидация Save в превью (Viber)
В `src/components/builder/PreviewPanel.tsx` исправить логику `emptyTemplate` для Viber-маршрута `viber(60)-sms`:
- сейчас: `textEmpty && smsEmpty` (блокируется только если ОБА пустые)
- стало: `textEmpty || smsEmpty` (блокируется если ХОТЯ БЫ ОДНО пустое)

Это закрывает оба пункта (1 — пустой SMS, 4 — пустой текст Viber).

### 2. Выпадающий список маршрутов (EditorPanel)
В `src/components/builder/EditorPanel.tsx` обновить `<option>` — убрать технический префикс роута, заменить «Viber» → «Viber Business»:
```text
viber(60)-sms  → "Viber Business, через 60 сек SMS"
viber-only     → "Только Viber Business"
sms-only       → "Только SMS"
```

### 3. Перенос длинных строк во всех превью
В `src/components/builder/PreviewPanel.tsx` добавить класс `break-all` (или `[overflow-wrap:anywhere]`) к контейнерам, где может появиться сплошная строка:
- основной текст сообщения (Telegram/MAX/Viber bubble) — `<div className="px-4 py-3 ...">`
- блок SMS preview — `<div className="rounded-xl ... whitespace-pre-wrap ...">`
- текст кнопок (опционально, чтобы длинная подпись не растягивала)

Это устранит выход символов за пределы поля на всех каналах.

### Файлы
- `src/components/builder/PreviewPanel.tsx` — пп. 1, 3, 4
- `src/components/builder/EditorPanel.tsx` — п. 2
