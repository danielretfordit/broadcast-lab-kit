## Финальные правки

### 0) WhatsApp — иконка в кнопке канала (AppHeader)
В `AppHeader.tsx` найти запись для `whatsapp` и привести `iconClassName` к `w-5 h-5` (как у Viber), убрав текущий увеличенный размер. Иконку (SVG) не трогаем.

### 1) WhatsApp — Header лимит 20 символов
В `EditorPanel.tsx` (строки ~610–621):
- Заменить лейбл «Header (опционально, до 60 симв.)» → «Header (опционально, до 20 симв.)».
- `maxLength={60}` → `maxLength={20}`.
- Добавить визуальную валидацию (счётчик/красная подсветка), если длина > 20 (через `maxLength` ввод и так не пустит, но добавим подсказку «осталось N» и проверку перед сохранением).
- В `SaveAllTemplatesDialog.tsx` `isWhatsAppFilled` — если `whatsappHeader.length > 20` → не считать заполненным. Аналогично в `PreviewPanel.tsx` `emptyTemplate` для WhatsApp.

Footer оставляем как есть (60 симв.).

### 2) Viber bot — опциональный thumbnail
- В `MessageData` (`message-builder.ts`) добавить поле `viberBotThumbnail?: string`.
- В `buildViberBotJson`: если `mediaType === 'photo'` и `viberBotThumbnail` непустой → добавить `thumbnail: msg.viberBotThumbnail` сразу после `media`.
- В `parseViberBotJson`: читать `parsed.thumbnail` в `viberBotThumbnail`.
- В `EditorPanel.tsx` (раздел «Медиа контент», виден только для viber_bot, когда `mediaType === 'photo'`): добавить ниже основного URL дополнительный input «Превью (thumbnail, опционально)» с подписью «Отображается до клика. Рекомендуется 400×400, до 100 KB».
- Поле сохраняется через `updateField('viberBotThumbnail', ...)`.

### 3) Переименование в SaveAllTemplatesDialog
В `PLATFORMS` (строка 29) `'HTML (Email)'` → `'Email (HTML)'`.

### 4) WhatsApp — иконка превью без кружка
В `PreviewPanel.tsx` (строки 205–208): убрать обёртку `div.w-7.h-7.rounded-full.bg-[#25D366]`, оставить только `<WhatsAppBrandIcon className="w-8 h-8" style={{ color: '#25D366' }} />` — по аналогии с Viber Bot (строка 204).

### 5) SaveAllTemplatesDialog — иконки Viber/WhatsApp без кружков
В `PlatformIcon` для `viber_bot` и `whatsapp` отрисовать иконку без обёртки-кружка одинакового размера (`w-7 h-7` непосредственно у SVG), цвета: Viber `#7360F2`, WhatsApp `#25D366`. Telegram/MAX/SMS оставляем в кружках (это их «классический» вид). Для `viber_business` (легаси) тоже привести к стилю иконки без кружка (тот же `ViberBrandIcon` `#7360F2`), чтобы оба Viber-канала смотрелись одинаково.

### 6) Убрать строку «API Method» под превью
В `PreviewPanel.tsx` удалить блок строк 387–406 целиком.

### 7) Самопроверка
- Прогнать TS-проверки на затронутых файлах.
- Убедиться, что валидация WhatsApp (Header > 20) корректно блокирует сохранение и в PreviewPanel, и в SaveAll.
- Убедиться, что thumbnail попадает в JSON только для viber_bot + photo + непустое значение, и корректно парсится обратно.

### Затронутые файлы
- `src/components/builder/AppHeader.tsx`
- `src/components/builder/EditorPanel.tsx`
- `src/components/builder/PreviewPanel.tsx`
- `src/components/builder/SaveAllTemplatesDialog.tsx`
- `src/lib/message-builder.ts`
