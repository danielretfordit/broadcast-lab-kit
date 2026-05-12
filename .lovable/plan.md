## Сохранение коллекции шаблонов всех каналов

Рядом с кнопкой «Сохранить в проект» — кнопка «…» с пунктом «Сохранить все шаблоны». Открывает модалку со списком шаблонов всех платформ (telegram / max / html), где можно отметить какие отправлять, и одним POST'ом отправить коллекцию.

### 1. Источник данных по всем платформам
- Drafts хранятся в `localStorage` по ключу `omni-builder-draft:<platform>` (см. `MessageContext.tsx`).
- Активная платформа — берём `message` из `useMessage()` (актуальнее localStorage из-за 300ms debounce).
- Остальные — читаем напрямую через хелпер `loadDraft(platform)` (вынесем экспорт из `MessageContext.tsx` или продублируем минимальный читатель в новом файле).
- Заполненность определяем теми же правилами, что в `PreviewPanel` (`emptyTemplate` + `mediaInvalid`):
  - `html`: `subject` и `text` непусты;
  - `telegram` / `max`: `text` непуст ИЛИ есть валидное медиа (одиночный `mediaUrl` или `album` ≥2 url) и нет `mediaInvalid`.

### 2. UI: кнопка «…» рядом с «Сохранить в проект»
- В футере `PreviewPanel.tsx` основная кнопка получает `flex-1`, рядом квадратная иконка-кнопка `MoreVertical`.
- По клику — `DropdownMenu` (shadcn) с пунктом «Сохранить все шаблоны» (иконка `Layers`).
- Пункт открывает `Dialog` (shadcn).
- В `viewOnly` режиме кнопку «…» не показываем.

### 3. Модалка «Сохранить все шаблоны»
- Заголовок: «Сохранить все шаблоны». Подзаголовок: «Будут отправлены выбранные шаблоны единой коллекцией».
- Таблица из 3 строк (Telegram / MAX / HTML), без превью:
  - «Канал» — иконка + название;
  - «Статус» — пилюля: зелёная `CheckCircle2 Заполнен` либо серая `XCircle Пусто`;
  - «Включить» — `Checkbox`. По умолчанию все ВКЛЮЧЕНЫ; для пустых — снят и `disabled`.
- Снизу: «Выбрано: N из M».
- Кнопки: «Отмена» и «Сохранить выбранные шаблоны» (primary, disabled при 0 выбранных, лоадер при отправке).

### 4. Отправка
- Тот же эндпоинт: `POST /api/saveTemplate/?guid=<guid>`.
- Тело — JSON c единственным полем `json`, содержащим коллекцию выбранных платформ:
  ```json
  {
    "json": {
      "telegram": <buildTelegramJson(draftTelegram)>,
      "max":      <buildMaxJson(draftMax)>,
      "html":     <buildEmailJson(draftHtml)>
    }
  }
  ```
  Невыбранные/пустые ключи опускаются (не `null`).
- Toast-успех/ошибка по аналогии с существующим `handleSaveToProject`.

### 5. Файлы
- `src/components/builder/PreviewPanel.tsx` — добавить кнопку «…», dropdown, открытие модалки.
- `src/components/builder/SaveAllTemplatesDialog.tsx` (новый) — модалка с таблицей, чекбоксами, отправкой.
- `src/contexts/MessageContext.tsx` — экспортировать `loadDraft` для чтения других платформ без переключения активной.

### Технические детали
- Платформы `['telegram','max','html']` с лейблами и иконками (Telegram svg, max-logo, `Mail` для HTML).
- Активная платформа в модалке всегда читается из `useMessage()`; остальные — из localStorage.
- Сборка JSON через существующие `buildTelegramJson` / `buildMaxJson` / `buildEmailJson`.
- Локальный `useState` для открытия модалки и `savingAll` для лоадера.
