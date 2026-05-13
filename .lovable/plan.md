# Правки раздела Viber

## 1. Канал бесплатный — убрать монеты
- В `AppHeader.tsx` для `viber_bot` снять `paid: true`.
- В `SaveAllTemplatesDialog.tsx` для `viber_bot` тоже `paid: false` (не показывать иконку Coins).

## 2. Плашка «24h» возле кнопки Viber (bot)
- В `AppHeader.tsx` в `platforms` добавить флаг `dialogWindow24h` (или похожий) для `viber_bot`.
- В рендере таба после метки добавить тот же бейдж `Clock + 24h` (amber), что и у WhatsApp, с тултипом про окно 24 часов.

## 3. Плашка «24h» в модальном окне сохранения коллекции
- В `SaveAllTemplatesDialog.tsx` в строке/чипе платформы для `viber_bot` (и в будущем whatsapp) добавить тот же компактный бейдж `24h`.

## 4. Фирменная иконка Viber (purple bubble) везде
- Перенести `ViberBrandIcon` из `AppHeader.tsx` в общий `src/components/icons/ViberBrandIcon.tsx`.
- Использовать её в:
  - превью `PreviewPanel.tsx` вместо нынешнего фиолетового кружка с буквой «V» (avatar = round bg + brand icon белым/фирменным),
  - `SaveAllTemplatesDialog.tsx` для строки `viber_bot`.

## 5. Скрыть подсказку Receiver ID
- В `BotSettingsDialog.tsx` для `viber_bot` убрать пример с реальным ID, оставить плейсхолдер `••••••••••••••••` и описание «Уникальный идентификатор получателя из Viber API».

## 6. Переименовать поле токена
- В `BotSettingsDialog.tsx` лейбл «Токен авторизации из кабинета Viber for Business» → «Токен авторизации из кабинета Viber».

## 7. Предзаполнение sender.name
- В `MessageContext.tsx` (или `createEmptyMessage`/`loadDraft` для `viber_bot`) задать дефолт `viberBotSenderName = 'ARMTEK | ЧАТ-БОТ | BY'`, если значение пустое.
- Аналогично в `BotSettingsDialog.tsx` placeholder/initial.

## 8. Для Viber bot убрать Видео и Файл из медиа
- В `EditorPanel.tsx` в селекторе типов медиа для `viber_bot` оставить только `none` и `photo` (picture). Видео/документ скрыть.
- В `buildViberBotJson` соответственно `type` будет либо `text`, либо `picture`.

## 9. Сложная клавиатура Viber по API

### Модель данных
Расширить `MessageData` опциональным полем:
```ts
viberKeyboard?: {
  bgColor: string;          // фиксируем '#ffa000' для строк-кнопок (см. ниже), фон клавиатуры — белый
  rows: ViberKbRow[];
}
ViberKbRow = { id: string; buttons: ViberKbButton[] }
ViberKbButton = {
  id: string;
  text: string;             // допускает <b> <i> <u>
  columns: number;          // 1..6
  rows: number;             // 1..2 (визуальная высота)
  actionType: 'reply' | 'open-url' | 'share-phone' | 'location-picker';
  actionBody: string;       // url / phone-reply / reply payload
  textSize: 'small' | 'regular' | 'large';
  textVAlign: 'top' | 'middle' | 'bottom';
  textHAlign: 'left' | 'center' | 'right';
}
```
Цвет фона кнопки **жёстко** `#ffa000`, без выбора в UI.

### Editor (`EditorPanel.tsx`, секция кнопок при `viber_bot`)
Заменить нынешний редактор инлайн-кнопок Telegram-стиля на отдельный «Конструктор клавиатуры Viber»:
- кнопка «+ Ряд» (до 24 рядов, как в API).
- внутри ряда — кнопки с полями:
  - текст (textarea, подсказка: «можно `<b>`, `<i>`, `<u>`, эмодзи»),
  - select **Тип действия**: Ответ / Открыть URL / Поделиться телефоном / Геолокация,
  - поле **Action body** (url / payload / `phone-reply` авто для share-phone),
  - селекторы **Columns (1–6)** и **Rows (1–2)** через числовые степперы или сегментированный контрол,
  - select размера текста и выравниваний (горизонтальное/вертикальное).
- drag-handles или стрелки для переупорядочивания, удаление кнопки/ряда.
- мини-валидация: сумма `columns` в ряду ≤ 6 (предупреждение), `share-phone` подсказывает зафиксировать `actionBody='phone-reply'`.

### JSON (`buildViberBotJson`)
Если `viberKeyboard` непустой и есть хотя бы 1 кнопка — добавить в payload:
```json
"keyboard": {
  "Type": "keyboard",
  "BgColor": "#ffffff",
  "Buttons": [ { "Columns":..., "Rows":..., "BgColor":"#ffa000",
    "ActionType":..., "ActionBody":..., "Text":...,
    "TextSize":..., "TextVAlign":..., "TextHAlign":..., "TextOpacity":100 } ]
}
```
Кнопки сериализуются плоским массивом в порядке: row0.buttons → row1.buttons → … (как в Viber API). Парсер `parseViberBotJson` восстанавливает ряды по сумме `Columns` (накопительно ≤ 6 → новый ряд) — простой эвристикой; если не сходится, складывает всё в один ряд.

### Preview (`PreviewPanel.tsx` для `viber_bot`)
Под пузырём сообщения отрисовать сетку клавиатуры:
- контейнер `grid grid-cols-6 gap-1 bg-white p-2 rounded-b-2xl`,
- каждая кнопка — `style={{ gridColumn: 'span N', gridRow: 'span M', backgroundColor:'#ffa000' }}`, белый текст, рендер ограниченного HTML (`<b><i><u>` через безопасный whitelist), выравнивания через `justify-content/align-items`, размер шрифта по `TextSize` (`text-xs/sm/base`).
- иконки-подсказки рядом с типом: 📞 для share-phone, 📍 для location, 🔗 для open-url.

### Сохранение/коллекция
`SaveAllTemplatesDialog.tsx` — `isFilled` для `viber_bot` уже учитывает text/media; клавиатура опциональна. JSON-сериализация уже идёт через `buildJson`, дополнительных правок не нужно.

## Технические детали / файлы

- `src/lib/message-builder.ts` — типы `ViberKbButton`, `ViberKbRow`; обновить `MessageData`, `buildViberBotJson`, `parseViberBotJson`.
- `src/components/icons/ViberBrandIcon.tsx` — новый общий компонент.
- `src/components/builder/AppHeader.tsx` — снять `paid` у `viber_bot`, добавить бейдж 24h, использовать общий иконкомпонент.
- `src/components/builder/EditorPanel.tsx` — для `viber_bot`: ограничить медиа (только photo), новый редактор клавиатуры.
- `src/components/builder/PreviewPanel.tsx` — новый аватар (brand icon), рендер клавиатуры grid 6-cols.
- `src/components/builder/JsonPanel.tsx` — без логических изменений (использует `buildJson`).
- `src/components/builder/BotSettingsDialog.tsx` — переименовать лейбл, скрыть пример Receiver ID, дефолт sender.name.
- `src/components/builder/SaveAllTemplatesDialog.tsx` — `paid:false` для viber_bot, бейдж 24h, brand-иконка.
- `src/contexts/MessageContext.tsx` — дефолт `viberBotSenderName = 'ARMTEK | ЧАТ-БОТ | BY'`.

Допущения:
- Backward-совместимость: старые черновики без `viberKeyboard` остаются валидными (поле опционально).
- Текст кнопки в превью рендерится через мини-парсер `<b>/<i>/<u>` без полноценного Markdown — этого достаточно по ТЗ Viber.
- В превью имитируем мобильную клавиатуру шириной во весь столбец сообщения.
