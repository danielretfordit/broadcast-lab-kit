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

// Escape special characters for Telegram MarkdownV2
export function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export function buildTelegramJson(msg: MessageData): object {
  const inlineKeyboard = msg.buttonRows
    .filter(row => row.buttons.length > 0)
    .map(row =>
      row.buttons.map(btn => {
        const obj: any = { text: btn.text };
        if (btn.url) obj.url = btn.url;
        else if (btn.callback_data) obj.callback_data = btn.callback_data;
        return obj;
      })
    );

  const replyMarkup = inlineKeyboard.length > 0
    ? { inline_keyboard: inlineKeyboard }
    : undefined;

  if (msg.mediaType === 'photo' && msg.mediaUrl) {
    return {
      chat_id: msg.chatId || '<CHAT_ID>',
      photo: msg.mediaUrl,
      caption: msg.text || undefined,
      parse_mode: msg.parseMode,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    };
  }

  if (msg.mediaType === 'video' && msg.mediaUrl) {
    return {
      chat_id: msg.chatId || '<CHAT_ID>',
      video: msg.mediaUrl,
      caption: msg.text || undefined,
      parse_mode: msg.parseMode,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    };
  }

  if (msg.mediaType === 'document' && msg.mediaUrl) {
    return {
      chat_id: msg.chatId || '<CHAT_ID>',
      document: msg.mediaUrl,
      caption: msg.text || undefined,
      parse_mode: msg.parseMode,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    };
  }

  return {
    chat_id: msg.chatId || '<CHAT_ID>',
    text: msg.text || '',
    parse_mode: msg.parseMode,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  };
}

// MAX (TamTam) API format
export function buildMaxJson(msg: MessageData): object {
  const attachments: any[] = [];

  if (msg.mediaType === 'photo' && msg.mediaUrl) {
    attachments.push({
      type: 'image',
      payload: { url: msg.mediaUrl },
    });
  } else if (msg.mediaType === 'video' && msg.mediaUrl) {
    attachments.push({
      type: 'video',
      payload: { url: msg.mediaUrl },
    });
  } else if (msg.mediaType === 'document' && msg.mediaUrl) {
    attachments.push({
      type: 'file',
      payload: { url: msg.mediaUrl },
    });
  }

  const inlineButtons = msg.buttonRows
    .filter(row => row.buttons.length > 0)
    .flatMap(row =>
      row.buttons.map(btn => {
        if (btn.url) {
          return { type: 'link', text: btn.text, url: btn.url };
        }
        return { type: 'callback', text: btn.text, payload: btn.callback_data || btn.text };
      })
    );

  if (inlineButtons.length > 0) {
    attachments.push({
      type: 'inline_keyboard',
      payload: {
        buttons: inlineButtons,
      },
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
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}
