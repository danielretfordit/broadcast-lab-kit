export type Platform = 'telegram' | 'max';

export interface InlineButton {
  id: string;
  text: string;
  url?: string;
  callback_data?: string;
}

export interface ButtonRow {
  id: string;
  buttons: InlineButton[];
}

export interface MessageData {
  platform: Platform;
  chatId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video' | 'document' | 'none';
  text: string;
  parseMode: 'MarkdownV2' | 'HTML';
  buttonRows: ButtonRow[];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function createEmptyMessage(): MessageData {
  return {
    platform: 'telegram',
    chatId: '',
    mediaUrl: '',
    mediaType: 'none',
    text: '',
    parseMode: 'MarkdownV2',
    buttonRows: [],
  };
}

/**
 * Escapes special characters for Telegram MarkdownV2.
 * These chars must be escaped: _ * [ ] ( ) ~ ` > # + - = | { } . !
 * BUT we do NOT escape chars inside formatting constructs the user typed intentionally.
 * The user is expected to write raw MarkdownV2 (with *bold*, _italic_, etc.)
 * so we only auto-escape characters that are NOT part of formatting.
 */
const MARKDOWN_V2_SPECIAL = /([.!\-=|{}()~`>#+])/g;

export function escapeMarkdownV2Plain(text: string): string {
  // Escape only non-formatting special chars in plain segments
  return text.replace(MARKDOWN_V2_SPECIAL, '\\$1');
}

/**
 * Process user-written text for Telegram MarkdownV2:
 * The user writes human-friendly markdown (*bold*, _italic_, __underline__, [text](url))
 * and we auto-escape all other MarkdownV2 special chars outside formatting tokens.
 */
export function prepareMarkdownV2(rawText: string): string {
  // Split text into segments: formatting tokens vs plain text
  // Regex matches: *text*, _text_, __text__, [text](url), `code`, ```pre```
  const formatRegex = /(\*[^*]+\*|__[^_]+__|_[^_]+_|\[[^\]]+\]\([^)]+\)|`[^`]+`|```[\s\S]+?```)/g;
  
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = formatRegex.exec(rawText)) !== null) {
    // Plain text before this match - escape it
    if (match.index > lastIndex) {
      const plain = rawText.substring(lastIndex, match.index);
      parts.push(escapeMarkdownV2Plain(plain));
    }
    
    const token = match[0];
    
    // For links [text](url) — escape special chars inside text and url separately
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = escapeMarkdownV2Plain(linkMatch[1]);
      const linkUrl = linkMatch[2]; // URLs should not be escaped in MarkdownV2
      parts.push(`[${linkText}](${linkUrl})`);
    } else {
      // For *bold*, _italic_, __underline__ — escape inner content
      const marker = token.startsWith('__') ? '__' :
                     token.startsWith('```') ? '```' :
                     token[0];
      const markerLen = marker.length;
      const inner = token.substring(markerLen, token.length - markerLen);
      parts.push(marker + escapeMarkdownV2Plain(inner) + marker);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Remaining plain text
  if (lastIndex < rawText.length) {
    parts.push(escapeMarkdownV2Plain(rawText.substring(lastIndex)));
  }
  
  return parts.join('');
}

export function buildTelegramJson(msg: MessageData): object {
  const processedText = msg.parseMode === 'MarkdownV2' 
    ? prepareMarkdownV2(msg.text)
    : msg.text;

  const inlineKeyboard = msg.buttonRows
    .filter(row => row.buttons.length > 0)
    .map(row =>
      row.buttons.map(btn => {
        const obj: Record<string, string> = { text: btn.text };
        if (btn.url) obj.url = btn.url;
        else if (btn.callback_data) obj.callback_data = btn.callback_data;
        return obj;
      })
    );

  const replyMarkup = inlineKeyboard.length > 0
    ? { inline_keyboard: inlineKeyboard }
    : undefined;

  const base: Record<string, unknown> = {
    chat_id: msg.chatId || '<CHAT_ID>',
  };

  if (msg.mediaType !== 'none' && msg.mediaUrl) {
    base[msg.mediaType] = msg.mediaUrl;
    if (processedText) base.caption = processedText;
  } else {
    base.text = processedText || '';
  }

  base.parse_mode = msg.parseMode;
  if (replyMarkup) base.reply_markup = replyMarkup;

  return base;
}

export function buildMaxJson(msg: MessageData): object {
  const attachments: Record<string, unknown>[] = [];

  if (msg.mediaType !== 'none' && msg.mediaUrl) {
    const typeMap = { photo: 'image', video: 'video', document: 'file' } as const;
    attachments.push({
      type: typeMap[msg.mediaType],
      payload: { url: msg.mediaUrl },
    });
  }

  const inlineButtons = msg.buttonRows
    .filter(row => row.buttons.length > 0)
    .flatMap(row =>
      row.buttons.map(btn => {
        if (btn.url) return { type: 'link', text: btn.text, url: btn.url };
        return { type: 'callback', text: btn.text, payload: btn.callback_data || btn.text };
      })
    );

  if (inlineButtons.length > 0) {
    attachments.push({
      type: 'inline_keyboard',
      payload: { buttons: inlineButtons },
    });
  }

  return {
    text: msg.text || '',
    ...(attachments.length > 0 ? { attachments } : {}),
  };
}

export function buildJson(msg: MessageData): object {
  return msg.platform === 'telegram' ? buildTelegramJson(msg) : buildMaxJson(msg);
}

export function validateJson(jsonStr: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(jsonStr);
    return { valid: true };
  } catch (e: unknown) {
    return { valid: false, error: (e as Error).message };
  }
}

/** Try to extract and repair JSON from arbitrary text */
export function extractJsonFromText(text: string): string {
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonStart = cleaned.search(/[{[]/);
  const startChar = jsonStart !== -1 ? cleaned[jsonStart] : null;
  const jsonEnd = cleaned.lastIndexOf(startChar === '[' ? ']' : '}');

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return cleaned;
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  // Fix trailing commas
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (c) => c === '\n' || c === '\t' ? c : '');

  return cleaned;
}
