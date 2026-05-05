import { escapeMarkdownV2Plain, prepareMarkdownV2 } from '@/lib/markdown';

export type Platform = 'telegram' | 'max' | 'html';

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
  mediaUrls: string[];
  mediaType: 'photo' | 'video' | 'document' | 'album' | 'none';
  text: string;
  subject: string;
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
    mediaUrls: [],
    mediaType: 'none',
    text: '',
    subject: '',
    parseMode: 'MarkdownV2',
    buttonRows: [],
  };
}

export function buildTelegramJson(msg: MessageData): object {
  const processedText = msg.parseMode === 'MarkdownV2'
    ? prepareMarkdownV2(msg.text)
    : msg.text;

  // Album: sendMediaGroup
  if (msg.mediaType === 'album') {
    const urls = (msg.mediaUrls || []).filter(u => u && u.trim());
    const media = urls.map((url, idx) => {
      const item: Record<string, unknown> = { type: 'photo', media: url };
      if (idx === 0 && processedText) {
        item.caption = processedText;
        item.parse_mode = msg.parseMode;
      }
      return item;
    });
    return {
      chat_id: msg.chatId || '<CHAT_ID>',
      media,
    };
  }

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

  if (msg.mediaType === 'album') {
    const urls = (msg.mediaUrls || []).filter(u => u && u.trim());
    for (const url of urls) {
      attachments.push({ type: 'image', payload: { url } });
    }
  } else if (msg.mediaType !== 'none' && msg.mediaUrl) {
    const typeMap = { photo: 'image', video: 'video', document: 'file' } as const;
    attachments.push({
      type: typeMap[msg.mediaType as 'photo' | 'video' | 'document'],
      payload: { url: msg.mediaUrl },
    });
  }

  // Album in Telegram can't have buttons; mirror that behavior for MAX collections
  const skipButtons = msg.mediaType === 'album';
  const inlineButtons = skipButtons ? [] : msg.buttonRows
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

  // Album JSON shape: { text, attachments } without "format"
  if (msg.mediaType === 'album') {
    return {
      text: msg.text || '',
      ...(attachments.length > 0 ? { attachments } : {}),
    };
  }

  return {
    format: msg.parseMode === 'HTML' ? 'html' : 'markdown',
    text: msg.text || '',
    ...(attachments.length > 0 ? { attachments } : {}),
  };
}

export function buildEmailJson(msg: MessageData): object {
  return {
    format: 'html',
    subject: msg.subject || '',
    html: msg.text || '',
  };
}

export function buildJson(msg: MessageData): object {
  if (msg.platform === 'telegram') return buildTelegramJson(msg);
  if (msg.platform === 'max') return buildMaxJson(msg);
  return buildEmailJson(msg);
}

/** Determine Telegram API method from message */
export function getTelegramMethod(msg: MessageData): string {
  if (msg.mediaType === 'album') return 'sendMediaGroup';
  if (msg.mediaType !== 'none' && msg.mediaUrl) {
    return `send${msg.mediaType.charAt(0).toUpperCase()}${msg.mediaType.slice(1)}`;
  }
  return 'sendMessage';
}

/** Reverse-parse a Telegram JSON object into MessageData fields */
export function parseTelegramJson(parsed: Record<string, unknown>): Partial<MessageData> {
  const result: Partial<MessageData> = {};

  if (parsed.chat_id != null) result.chatId = String(parsed.chat_id);
  if (typeof parsed.text === 'string') result.text = parsed.text;
  if (typeof parsed.caption === 'string') result.text = parsed.caption;
  if (typeof parsed.parse_mode === 'string') {
    result.parseMode = parsed.parse_mode as 'MarkdownV2' | 'HTML';
  }

  const mediaKeys = ['photo', 'video', 'document'] as const;
  let foundMedia = false;
  for (const key of mediaKeys) {
    if (typeof parsed[key] === 'string') {
      result.mediaType = key;
      result.mediaUrl = parsed[key] as string;
      foundMedia = true;
      break;
    }
  }
  if (!foundMedia) {
    result.mediaType = 'none';
    result.mediaUrl = '';
  }

  const replyMarkup = parsed.reply_markup as Record<string, unknown> | undefined;
  if (replyMarkup?.inline_keyboard && Array.isArray(replyMarkup.inline_keyboard)) {
    result.buttonRows = (replyMarkup.inline_keyboard as Record<string, string>[][]).map(row => ({
      id: generateId(),
      buttons: row.map(btn => ({
        id: generateId(),
        text: btn.text || '',
        url: btn.url || '',
        callback_data: btn.callback_data || '',
      })),
    }));
  } else {
    result.buttonRows = [];
  }

  return result;
}

export function parseMaxJson(parsed: Record<string, unknown>): Partial<MessageData> {
  const result: Partial<MessageData> = {};

  if (typeof parsed.text === 'string') result.text = parsed.text;
  if (parsed.format === 'html') result.parseMode = 'HTML';
  else result.parseMode = 'MarkdownV2';

  result.mediaType = 'none';
  result.mediaUrl = '';
  result.buttonRows = [];

  if (Array.isArray(parsed.attachments)) {
    for (const att of parsed.attachments as Record<string, unknown>[]) {
      if (att.type === 'image' || att.type === 'video' || att.type === 'file') {
        const typeMap: Record<string, 'photo' | 'video' | 'document'> = {
          image: 'photo', video: 'video', file: 'document',
        };
        result.mediaType = typeMap[att.type as string] || 'none';
        const payload = att.payload as Record<string, string> | undefined;
        result.mediaUrl = payload?.url || '';
      }
      if (att.type === 'inline_keyboard') {
        const payload = att.payload as Record<string, unknown> | undefined;
        if (payload?.buttons && Array.isArray(payload.buttons)) {
          result.buttonRows = (payload.buttons as Record<string, string>[][]).map(row => ({
            id: generateId(),
            buttons: (Array.isArray(row) ? row : [row]).map(btn => ({
              id: generateId(),
              text: btn.text || '',
              url: btn.url || '',
              callback_data: btn.payload || '',
            })),
          }));
        }
      }
    }
  }

  return result;
}

export function parseEmailJson(parsed: Record<string, unknown>): Partial<MessageData> {
  return {
    subject: typeof parsed.subject === 'string' ? parsed.subject : '',
    text: typeof parsed.html === 'string' ? parsed.html : (typeof parsed.text === 'string' ? parsed.text : ''),
    parseMode: 'HTML',
    mediaType: 'none',
    mediaUrl: '',
    buttonRows: [],
  };
}

export function parseJsonToMessage(jsonStr: string, platform: Platform): Partial<MessageData> {
  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  if (platform === 'telegram') return parseTelegramJson(parsed);
  if (platform === 'max') return parseMaxJson(parsed);
  return parseEmailJson(parsed);
}

export function validateJson(jsonStr: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(jsonStr);
    return { valid: true };
  } catch (e: unknown) {
    return { valid: false, error: (e as Error).message };
  }
}

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
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (c) => c === '\n' || c === '\t' ? c : '');

  return cleaned;
}
