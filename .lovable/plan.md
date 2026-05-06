## Plan: 3 fixes for the JSON test flow + header

### 1) Fix "Укажите ссылку на медиа (album)" error in test send

**File:** `src/components/builder/JsonPanel.tsx` (`handleTest`)

Current validation only checks `message.mediaUrl`, which is empty for albums. Replace the guard:

```ts
if (message.mediaType === 'album') {
  const urls = (message.mediaUrls || []).filter(u => u.trim());
  if (urls.length < 2) {
    toast.error('Для альбома нужно минимум 2 фото');
    return;
  }
} else if (message.mediaType !== 'none' && !message.mediaUrl.trim()) {
  toast.error(`Укажите ссылку на медиа (${message.mediaType})`);
  return;
}
```

### 2) Click on logo / tool name reloads page with cache reset

**File:** `src/components/builder/AppHeader.tsx`

Wrap the left brand block (logo square + "CRM Ads" / "Конструктор рассылок") in a clickable button:

```ts
const handleHardReset = () => {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('omni-builder-draft'))
      .forEach(k => localStorage.removeItem(k));
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('bot-settings:'))
      .forEach(k => sessionStorage.removeItem(k));
  } catch {}
  window.location.reload(); // preserve URL (?type/?channel locks)
};
```

Add `cursor-pointer`, hover opacity, tooltip "Сбросить кэш и перезагрузить".

### 3) MAX test sending

`user_id` для MAX берётся из поля **Chat ID редактора** (`message.chatId`).

**a) `src/components/builder/BotSettingsDialog.tsx`** — enable MAX input:
- Remove all `disabled={isMax}`.
- Label MAX: `Access Token`, placeholder `f9LHodD0cOIR5XiHPjx5...`.
- Helper text MAX: "Укажите Access Token, выданный платформой MAX".

**b) `src/components/builder/JsonPanel.tsx`** — implement MAX branch in `handleTest`:

Remove the early `if (!isTelegram)` block and the `disabled={isMax}` on the Тестировать button. Then:

```ts
if (isMax) {
  const token = getBotToken('max');
  if (!token) { toast.error('Сначала укажите Access Token'); setSettingsOpen(true); return; }
  if (!message.chatId.trim()) { toast.error('Укажите Chat ID (user_id)'); return; }
  // album/media validation as in step 1

  const userId = encodeURIComponent(message.chatId.trim());
  const url = `https://platform-api.max.ru/messages?user_id=${userId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': token,           // raw token, NOT "Bearer ..."
      'Content-Type': 'application/json',
    },
    body: editMode ? jsonText : generatedJson,
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) toast.success(`MAX: отправлено${data.message_id ? ' • id: ' + data.message_id : ''}`);
  else toast.error(`MAX: ${data?.message || data?.error || res.status}`);
  return;
}
```

**Note on CORS:** `platform-api.max.ru` may block direct browser calls. Mirroring the Telegram client-side approach for now; if CORS blocks, follow-up will move it through an edge function proxy.

### Files changed
- `src/components/builder/JsonPanel.tsx` — album validation + MAX test branch
- `src/components/builder/AppHeader.tsx` — clickable brand block with hard-reset
- `src/components/builder/BotSettingsDialog.tsx` — enable MAX token input
