# Правки раздела Viber (клавиатура) + фикс ошибок

## 1. Убрать типы действий «Поделиться телефоном» и «Геолокация»
- `src/lib/message-builder.ts`: сузить `ViberKbActionType` до `'reply' | 'open-url'`. В парсере `parseViberBotJson` неподдерживаемые типы (`share-phone`, `location-picker`, неизвестные) маппить в `'reply'`. В сериализаторе оставить только два варианта.
- `src/components/builder/EditorPanel.tsx`: убрать `<option>` для `share-phone` и `location-picker`; убрать ветку с `actionBody='phone-reply'` и `disabled` для share-phone. Лейбл/плейсхолдер action body — только для `open-url` (URL) и `reply` (Payload).

## 2. Выбор фона кнопки из фиксированного набора цветов
- `src/lib/message-builder.ts`: добавить `VIBER_BTN_BG_PALETTE = ['#FF7300','#1A2229','#343F49','#F5F7F9','#FFFFFF','#0054A6']`. Расширить `ViberKbButton` опциональным `bgColor: string` (default `'#FF7300'`). В `createEmptyViberButton` ставить `bgColor: '#FF7300'`. В `buildViberKeyboard` использовать `btn.bgColor ?? '#FF7300'` вместо хардкода. В `parseViberBotJson` читать `BgColor` если он из палитры, иначе fallback `'#FF7300'`.
- `src/components/builder/EditorPanel.tsx`: добавить компактный пикер цвета (6 квадратиков-кружков из палитры с `ring` для активного) в карточке кнопки.
- `src/components/builder/PreviewPanel.tsx`: в `ViberKeyboardPreview` использовать `btn.bgColor` для `backgroundColor`. Цвет текста подбирать по контрасту: для светлых (`#F5F7F9`, `#FFFFFF`) — тёмный текст (`#1A2229`), для остальных — белый.

## 3. Форматирование текста кнопки (b / i) с открытым и закрытым тегом
- `src/components/builder/EditorPanel.tsx`: над textarea текста кнопки добавить мини-тулбар из 4 кнопок-вставок (по аналогии с insertFormatting):
  - «<b>», «</b>», «<i>», «</i>»
  - вставка в текущую позицию каретки конкретно поля «text» этой кнопки (по `id` textarea, например `viber-btn-text-{btn.id}`).
- Подсказка под полем: «Доступно форматирование: `<b>…</b>`, `<i>…</i>`».
- (Подчёркивание `<u>` не добавляем — не упомянуто; парсер в превью оставим терпимым.)

## 4. Убрать символ 🔗 в превью
- `src/components/builder/PreviewPanel.tsx`: в `actionIcon` убрать пару `'open-url': '🔗'` (оставить пустую строку), и в рендере не добавлять префикс-иконку, если значение пустое. Поскольку `share-phone`/`location-picker` удаляются (п.1), карта `actionIcon` фактически становится не нужна — можно удалить полностью.

## 6. Фикс перезагрузки страницы из-за ошибок JSON в консоли
Симптом: `GET /api/getTemplate?guid=null` возвращает 500, `res.json()` падает с `Unexpected end of JSON input`, отлавливается как unhandled rejection → диагностика дёргает hot-reload, страница циклически перезагружается.

Исправления в `src/components/builder/AppHeader.tsx`:
- В `getHttpJson` сделать early-return, если `guid` отсутствует/пустой/`'null'`.
- Добавить проверку `res.ok` перед `res.json()`; если `!ok` или контент пустой — тихо выходить (без throw).
- Обернуть в `try/catch`, чтобы Promise не оставался unhandled. Логировать через `console.warn` (не `error`), чтобы не триггерить runtime-error overlay.
- Сделать функцию `async` и `await`-ить fetch, иначе `.then()`-цепочка теряется и unhandled rejection всё равно всплывает.
- В `useEffect` вызывать `getHttpJson().catch(() => {})` как дополнительный safety-net.

Аналогичная правка в `src/hooks/useProjectInfo.ts` (там тот же `getHttpJson` без проверки `res.ok`) — добавить `if (!res.ok) return null;` и try/catch вокруг `res.json()`, чтобы не плодить ту же ошибку из второго места.

## Файлы
- `src/lib/message-builder.ts`
- `src/components/builder/EditorPanel.tsx`
- `src/components/builder/PreviewPanel.tsx`
- `src/components/builder/AppHeader.tsx`
- `src/hooks/useProjectInfo.ts`

## Допущения
- Старые черновики с `actionType: 'share-phone' | 'location-picker'` автоматически переедут в `'reply'` при следующем парсинге/сохранении (без потери самой кнопки).
- Старые кнопки без `bgColor` отображаются с дефолтом `#FF7300` (визуально без изменений).
