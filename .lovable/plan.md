## Viber keyboard fixes

### 1) Корректный рендер при смешанных Rows (1 и 2)
`PreviewPanel.tsx` → `ViberKeyboardPreview`: переделать сетку на `grid-template-columns: repeat(6, 1fr)` + `grid-auto-rows: 36px` + `grid-auto-flow: dense`. Каждая кнопка получает `gridColumn: span cols` и `gridRow: span rows`. Убрать `minHeight`. Это корректно отрисует кнопку Rows=2 рядом с Rows=1 (вторая займёт две ячейки вертикально, соседняя — одну, без перекосов).

### 2) Форматирование цвета и размера текста кнопки `<font>`
**Документация Viber:** `<font color="#HEX">X</font>`, `<font size="N">X</font>` (N: 12–32).

**Editor (`EditorPanel.tsx`)** — расширить мини-тулбар форматирования текста кнопки (рядом с `<b>/<i>`):
- Кнопки вставки: `<font color='#FFFFFF'>`, `<font color='#000000'>`, `</font>`
- Селект размера (12, 14, 16, 18, 20, 24, 28, 32) → вставляет `<font size='N'>` (закрытие общим `</font>`)

**Preview (`PreviewPanel.tsx`)** — расширить `renderViberBtnText`:
- В whitelist добавить `<font ...>` и `</font>`. Парсить только атрибуты `color` (валидный `#RRGGBB`) и `size` (число 12–32). Конвертировать в безопасный inline-`<span style="color:...; font-size:...px">`.
- Закрывающий `</font>` → `</span>`.
- Остальные теги/значения экранируются как раньше.

**Build/Parse (`message-builder.ts`)** — текст кнопки уже передаётся как есть, изменений не требуется.

### 3) Иконка Viber: больше, без круга, классическая сиреневая
- `PreviewPanel.tsx` (строки 188–201): для `viber_bot` заменить круглый аватар на `<ViberBrandIcon className="w-8 h-8" style={{ color: '#7360F2' }} />` без фоновой подложки. Для `viber_business` оставить текущее поведение или применить ту же иконку без круга — применим то же изменение.
- `SaveAllTemplatesDialog.tsx` (строки 89–102): для `viber_bot` (и `viber_business`) убрать `w-7 h-7 rounded-full bg-[#7360F2]` обёртку, рендерить `<ViberBrandIcon className="w-7 h-7" style={{color:'#7360F2'}} />` напрямую.

### 4) Убрать строку «Цвет фона #FF7300 (фиксирован)»
`EditorPanel.tsx` строки 769–772 — удалить блок целиком.

### 5) Убрать `#0054A6` из палитры
`message-builder.ts` → `VIBER_BTN_BG_PALETTE` оставить: `['#FF7300','#1A2229','#343F49','#F5F7F9','#FFFFFF']`.

### 6) Перепроверка счётчика 8/6 колонок
Логика `sumCols = row.buttons.reduce((s,b)=>s+(b.columns||0),0)` корректна. Подтвердить визуально, что предупреждение «⚠ перебор» появляется только при `sumCols > 6`, и что при 6/6 предупреждения нет. Никакой фактический баг кроме уже описанных не найден — изменений в логике подсчёта не требуется, но добавим явную подсказку: «Максимум 6 колонок в ряду — лишние кнопки в Viber попадут на новую строку».

### Файлы
- `src/lib/message-builder.ts` — палитра без `#0054A6`.
- `src/components/builder/EditorPanel.tsx` — тулбар `<font>` + размер, удалить строку «фиксирован», подсказка про 6/6.
- `src/components/builder/PreviewPanel.tsx` — новая grid-раскладка клавиатуры, расширенный `renderViberBtnText` (font color/size), иконка Viber без круга.
- `src/components/builder/SaveAllTemplatesDialog.tsx` — иконка Viber без круга.
