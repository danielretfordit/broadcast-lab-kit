import { escapeMarkdownV2Plain, prepareMarkdownV2 } from '@/lib/markdown';

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
    .map(row =>
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
    format: msg.parseMode === 'HTML' ? 'html' : 'markdown',
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
