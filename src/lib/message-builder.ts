import { escapeMarkdownV2Plain, prepareMarkdownV2 } from '@/lib/markdown';

export type Platform = 'telegram' | 'max' | 'html' | 'viber_business' | 'sms' | 'viber_bot' | 'whatsapp';

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

export type ViberKbActionType = 'reply' | 'open-url';
export type ViberKbTextSize = 'small' | 'regular' | 'large';
export type ViberKbAlignH = 'left' | 'center' | 'right';
export type ViberKbAlignV = 'top' | 'middle' | 'bottom';

export interface ViberKbButton {
  id: string;
  text: string;
  columns: number; // 1..6
  rows: number; // 1..2
  actionType: ViberKbActionType;
  actionBody: string;
  textSize: ViberKbTextSize;
  textHAlign: ViberKbAlignH;
  textVAlign: ViberKbAlignV;
  bgColor?: string;
}

export interface ViberKbRow {
  id: string;
  buttons: ViberKbButton[];
}

export interface ViberKeyboard {
  rows: ViberKbRow[];
}

export interface MessageData {
  platform: Platform;
  chatId: string;
  mediaUrl: string;
  mediaUrls: string[];
  mediaType: 'photo' | 'video' | 'document' | 'album' | 'none';
  text: string;
  subject: string;
  parseMode: 'MarkdownV2' | 'Markdown' | 'HTML';
  buttonRows: ButtonRow[];
  smsText?: string;
  viberRoute?: string;
  viberBotSenderName?: string;
  viberBotTrackingData?: string;
  viberKeyboard?: ViberKeyboard;
  // WhatsApp
  whatsappHeader?: string;
  whatsappFooter?: string;
  whatsappFilename?: string;
}

export const VIBER_BTN_BG = '#FF7300';
export const VIBER_KB_BG = '#ffffff';
export const VIBER_BTN_BG_PALETTE = ['#FF7300', '#1A2229', '#343F49', '#F5F7F9', '#FFFFFF'] as const;

export function createEmptyViberButton(): ViberKbButton {
  return {
    id: generateId(),
    text: 'Кнопка',
    columns: 6,
    rows: 1,
    actionType: 'reply',
    actionBody: 'reply',
    textSize: 'regular',
    textHAlign: 'center',
    textVAlign: 'middle',
    bgColor: '#FF7300',
  };
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

export function buildViberJson(msg: MessageData): object {
  const route = msg.viberRoute || 'viber(60)-sms';

  if (route === 'sms-only') {
    return {
      login: '******',
      password: '******',
      phones: '<phone>',
      message: msg.smsText || '',
      route: 'sms',
      rus: '1',
    };
  }

  const btn = msg.buttonRows[0]?.buttons[0];
  const outRoute = route === 'viber-only' ? 'viber' : route;
  const base: Record<string, unknown> = {
    login: '******',
    password: '******',
    phones: '<phone>',
    message: msg.text || '',
    route: outRoute,
    rus: '1',
  };
  if (msg.mediaUrl) base.image_url = msg.mediaUrl;
  if (btn?.url) base.btn_url = btn.url;
  if (btn?.text) base.btn_name = btn.text;
  if (route !== 'viber-only') {
    base.param_sms = msg.smsText || '';
  }
  return base;
}

export function buildSmsJson(msg: MessageData): object {
  return { message: (msg.smsText || msg.text || '') };
}

export function parseSmsJson(parsed: Record<string, unknown>): Partial<MessageData> {
  return {
    text: '',
    smsText: typeof parsed.message === 'string' ? parsed.message : '',
    parseMode: 'Markdown',
    mediaType: 'none',
    mediaUrl: '',
    mediaUrls: [],
    buttonRows: [],
  };
}

export function buildJson(msg: MessageData): object {
  if (msg.platform === 'telegram') return buildTelegramJson(msg);
  if (msg.platform === 'max') return buildMaxJson(msg);
  if (msg.platform === 'viber_business') return buildViberJson(msg);
  if (msg.platform === 'viber_bot') return buildViberBotJson(msg);
  if (msg.platform === 'sms') return buildSmsJson(msg);
  if (msg.platform === 'whatsapp') return buildWhatsAppJson(msg);
  return buildEmailJson(msg);
}

function buildViberKeyboard(kb?: ViberKeyboard): Record<string, unknown> | null {
  if (!kb || !kb.rows || kb.rows.length === 0) return null;
  const buttons: Record<string, unknown>[] = [];
  for (const row of kb.rows) {
    for (const b of row.buttons) {
      const sizeMap: Record<ViberKbTextSize, string> = { small: 'small', regular: 'regular', large: 'large' };
      const vMap: Record<ViberKbAlignV, string> = { top: 'top', middle: 'middle', bottom: 'bottom' };
      const hMap: Record<ViberKbAlignH, string> = { left: 'left', center: 'center', right: 'right' };
      const actionMap: Record<ViberKbActionType, string> = {
        'reply': 'reply',
        'open-url': 'open-url',
      };
      const at: ViberKbActionType = b.actionType === 'open-url' ? 'open-url' : 'reply';
      const bg = b.bgColor && (VIBER_BTN_BG_PALETTE as readonly string[]).includes(b.bgColor) ? b.bgColor : VIBER_BTN_BG;
      buttons.push({
        Columns: Math.max(1, Math.min(6, b.columns || 6)),
        Rows: Math.max(1, Math.min(2, b.rows || 1)),
        BgColor: bg,
        ActionType: actionMap[at],
        ActionBody: b.actionBody || '',
        Text: b.text || '',
        TextSize: sizeMap[b.textSize],
        TextVAlign: vMap[b.textVAlign],
        TextHAlign: hMap[b.textHAlign],
        TextOpacity: 100,
      });
    }
  }
  if (buttons.length === 0) return null;
  return {
    Type: 'keyboard',
    BgColor: VIBER_KB_BG,
    Buttons: buttons,
  };
}

export function buildViberBotJson(msg: MessageData): object {
  const base: Record<string, unknown> = {
    receiver: '<service_user_id>',
    min_api_version: 4,
    sender: { name: msg.viberBotSenderName || 'ARMTEK | ЧАТ-БОТ | BY' },
    tracking_data: msg.viberBotTrackingData || 'tracking data',
    text: msg.text || '',
  };
  if (msg.mediaType === 'photo' && msg.mediaUrl) {
    base.type = 'picture';
    base.media = msg.mediaUrl;
  } else {
    base.type = 'text';
  }
  const keyboard = buildViberKeyboard(msg.viberKeyboard);
  if (keyboard) base.keyboard = keyboard;
  return base;
}

export function parseViberBotJson(parsed: Record<string, unknown>): Partial<MessageData> {
  const result: Partial<MessageData> = {
    text: typeof parsed.text === 'string' ? parsed.text : '',
    parseMode: 'Markdown',
    mediaUrls: [],
    buttonRows: [],
    mediaType: 'none',
    mediaUrl: '',
  };
  const sender = parsed.sender as Record<string, unknown> | undefined;
  if (sender && typeof sender.name === 'string') result.viberBotSenderName = sender.name;
  if (typeof parsed.tracking_data === 'string') result.viberBotTrackingData = parsed.tracking_data;
  const type = typeof parsed.type === 'string' ? parsed.type : 'text';
  const media = typeof parsed.media === 'string' ? parsed.media : '';
  if (media && type === 'picture') {
    result.mediaType = 'photo';
    result.mediaUrl = media;
  }

  const keyboard = parsed.keyboard as Record<string, unknown> | undefined;
  if (keyboard && Array.isArray(keyboard.Buttons)) {
    const btns = keyboard.Buttons as Record<string, unknown>[];
    const rows: ViberKbRow[] = [];
    let curRow: ViberKbRow = { id: generateId(), buttons: [] };
    let cols = 0;
    for (const b of btns) {
      const c = Math.max(1, Math.min(6, Number(b.Columns) || 6));
      if (cols + c > 6 && curRow.buttons.length > 0) {
        rows.push(curRow);
        curRow = { id: generateId(), buttons: [] };
        cols = 0;
      }
      const atRaw = String(b.ActionType || 'reply');
      const at: ViberKbActionType = atRaw === 'open-url' ? 'open-url' : 'reply';
      const ts = String(b.TextSize || 'regular') as ViberKbTextSize;
      const ha = String(b.TextHAlign || 'center') as ViberKbAlignH;
      const va = String(b.TextVAlign || 'middle') as ViberKbAlignV;
      const bgRaw = typeof b.BgColor === 'string' ? b.BgColor : '';
      const bg = (VIBER_BTN_BG_PALETTE as readonly string[]).includes(bgRaw) ? bgRaw : VIBER_BTN_BG;
      curRow.buttons.push({
        id: generateId(),
        text: typeof b.Text === 'string' ? b.Text : '',
        columns: c,
        rows: Math.max(1, Math.min(2, Number(b.Rows) || 1)),
        actionType: at,
        actionBody: typeof b.ActionBody === 'string' ? b.ActionBody : '',
        textSize: ['small', 'regular', 'large'].includes(ts) ? ts : 'regular',
        textHAlign: ['left', 'center', 'right'].includes(ha) ? ha : 'center',
        textVAlign: ['top', 'middle', 'bottom'].includes(va) ? va : 'middle',
        bgColor: bg,
      });
      cols += c;
    }
    if (curRow.buttons.length > 0) rows.push(curRow);
    result.viberKeyboard = { rows };
  }

  return result;
}

// ============================================================
// WhatsApp (tyntec)
// ============================================================

export function buildWhatsAppJson(msg: MessageData): object {
  const buttons = (msg.buttonRows[0]?.buttons || []).slice(0, 3);
  const hasButtons = buttons.length > 0;

  const base: Record<string, unknown> = {
    from: '*****',
    to: '<service_user_id>',
    channel: 'whatsapp',
  };

  if (hasButtons) {
    const components: Record<string, unknown> = {
      body: { type: 'text', text: msg.text || '' },
    };
    if (msg.whatsappHeader && msg.whatsappHeader.trim()) {
      components.header = { type: 'text', text: msg.whatsappHeader };
    }
    if (msg.whatsappFooter && msg.whatsappFooter.trim()) {
      components.footer = { type: 'text', text: msg.whatsappFooter };
    }
    components.buttons = buttons.map(b => ({
      type: 'reply',
      reply: {
        payload: b.callback_data || b.id,
        title: b.text || '',
      },
    }));

    base.content = {
      contentType: 'interactive',
      interactive: {
        subType: 'buttons',
        components,
      },
    };
    return base;
  }

  // Non-interactive
  if (msg.mediaType === 'photo' && msg.mediaUrl) {
    base.content = {
      contentType: 'image',
      image: { caption: msg.text || '', url: msg.mediaUrl },
    };
  } else if (msg.mediaType === 'video' && msg.mediaUrl) {
    base.content = {
      contentType: 'video',
      video: { caption: msg.text || '', url: msg.mediaUrl },
    };
  } else if (msg.mediaType === 'document' && msg.mediaUrl) {
    const doc: Record<string, unknown> = { url: msg.mediaUrl };
    if (msg.text) doc.caption = msg.text;
    if (msg.whatsappFilename) doc.filename = msg.whatsappFilename;
    base.content = { contentType: 'document', document: doc };
  } else {
    base.content = { contentType: 'text', text: msg.text || '' };
  }
  return base;
}

export function parseWhatsAppJson(parsed: Record<string, unknown>): Partial<MessageData> {
  const result: Partial<MessageData> = {
    text: '',
    parseMode: 'Markdown',
    mediaType: 'none',
    mediaUrl: '',
    mediaUrls: [],
    buttonRows: [],
    whatsappHeader: '',
    whatsappFooter: '',
    whatsappFilename: '',
  };
  const content = parsed.content as Record<string, unknown> | undefined;
  if (!content) return result;
  const ct = String(content.contentType || 'text');
  if (ct === 'text') {
    result.text = typeof content.text === 'string' ? content.text : '';
  } else if (ct === 'image') {
    const img = content.image as Record<string, unknown> | undefined;
    if (img) {
      result.mediaType = 'photo';
      result.mediaUrl = typeof img.url === 'string' ? img.url : '';
      result.text = typeof img.caption === 'string' ? img.caption : '';
    }
  } else if (ct === 'video') {
    const v = content.video as Record<string, unknown> | undefined;
    if (v) {
      result.mediaType = 'video';
      result.mediaUrl = typeof v.url === 'string' ? v.url : '';
      result.text = typeof v.caption === 'string' ? v.caption : '';
    }
  } else if (ct === 'document') {
    const d = content.document as Record<string, unknown> | undefined;
    if (d) {
      result.mediaType = 'document';
      result.mediaUrl = typeof d.url === 'string' ? d.url : '';
      result.text = typeof d.caption === 'string' ? d.caption : '';
      result.whatsappFilename = typeof d.filename === 'string' ? d.filename : '';
    }
  } else if (ct === 'interactive') {
    const it = content.interactive as Record<string, unknown> | undefined;
    const comps = it?.components as Record<string, unknown> | undefined;
    if (comps) {
      const header = comps.header as Record<string, unknown> | undefined;
      const body = comps.body as Record<string, unknown> | undefined;
      const footer = comps.footer as Record<string, unknown> | undefined;
      if (header && typeof header.text === 'string') result.whatsappHeader = header.text;
      if (body && typeof body.text === 'string') result.text = body.text;
      if (footer && typeof footer.text === 'string') result.whatsappFooter = footer.text;
      const btns = Array.isArray(comps.buttons) ? comps.buttons as Record<string, unknown>[] : [];
      const buttons: InlineButton[] = btns.map(b => {
        const reply = b.reply as Record<string, unknown> | undefined;
        return {
          id: generateId(),
          text: typeof reply?.title === 'string' ? reply.title : '',
          callback_data: typeof reply?.payload === 'string' ? reply.payload : '',
        };
      });
      if (buttons.length > 0) {
        result.buttonRows = [{ id: generateId(), buttons }];
      }
    }
  }
  return result;
}

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

  // Album: media is an array
  if (Array.isArray(parsed.media)) {
    const items = parsed.media as Record<string, unknown>[];
    const photos = items.filter(m => m.type === 'photo' && typeof m.media === 'string');
    if (photos.length > 0) {
      result.mediaType = 'album';
      result.mediaUrls = photos.map(p => p.media as string);
      result.mediaUrl = '';
      const firstCaption = photos[0].caption;
      if (typeof firstCaption === 'string') result.text = firstCaption;
      const firstParse = photos[0].parse_mode;
      if (typeof firstParse === 'string') result.parseMode = firstParse as 'MarkdownV2' | 'HTML';
    }
  }

  if (result.mediaType !== 'album') {
    const mediaKeys = ['photo', 'video', 'document'] as const;
    let foundMedia = false;
    for (const key of mediaKeys) {
      if (typeof parsed[key] === 'string') {
        result.mediaType = key;
        result.mediaUrl = parsed[key] as string;
        result.mediaUrls = [];
        foundMedia = true;
        break;
      }
    }
    if (!foundMedia) {
      result.mediaType = 'none';
      result.mediaUrl = '';
      result.mediaUrls = [];
    }
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
  else result.parseMode = 'Markdown';

  result.mediaType = 'none';
  result.mediaUrl = '';
  result.mediaUrls = [];
  result.buttonRows = [];

  if (Array.isArray(parsed.attachments)) {
    const attachments = parsed.attachments as Record<string, unknown>[];
    const imageAtts = attachments.filter(a => a.type === 'image');

    if (imageAtts.length >= 2) {
      result.mediaType = 'album';
      result.mediaUrls = imageAtts
        .map(a => (a.payload as Record<string, string> | undefined)?.url || '')
        .filter(Boolean);
    }

    for (const att of attachments) {
      if (result.mediaType !== 'album' && (att.type === 'image' || att.type === 'video' || att.type === 'file')) {
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
    mediaUrls: [],
    buttonRows: [],
  };
}

export function parseViberJson(parsed: Record<string, unknown>): Partial<MessageData> {
  const rawRoute = typeof parsed.route === 'string' ? parsed.route : 'viber(60)-sms';
  const normalizedRoute = rawRoute === 'viber' ? 'viber-only' : rawRoute === 'sms' ? 'sms-only' : rawRoute;
  const result: Partial<MessageData> = {
    text: typeof parsed.message === 'string' ? parsed.message : '',
    smsText: typeof parsed.param_sms === 'string' ? parsed.param_sms : '',
    viberRoute: normalizedRoute,
    parseMode: 'Markdown',
    mediaUrls: [],
    buttonRows: [],
  };
  const imageUrl = typeof parsed.image_url === 'string' ? parsed.image_url : '';
  if (imageUrl) {
    result.mediaType = 'photo';
    result.mediaUrl = imageUrl;
  } else {
    result.mediaType = 'none';
    result.mediaUrl = '';
  }
  const btnUrl = typeof parsed.btn_url === 'string' ? parsed.btn_url : '';
  const btnName = typeof parsed.btn_name === 'string' ? parsed.btn_name : '';
  if (btnUrl || btnName) {
    result.buttonRows = [{
      id: generateId(),
      buttons: [{ id: generateId(), text: btnName, url: btnUrl }],
    }];
  }
  return result;
}

export function parseJsonToMessage(jsonStr: string, platform: Platform): Partial<MessageData> {
  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  if (platform === 'telegram') return parseTelegramJson(parsed);
  if (platform === 'max') return parseMaxJson(parsed);
  if (platform === 'viber_business') return parseViberJson(parsed);
  if (platform === 'viber_bot') return parseViberBotJson(parsed);
  if (platform === 'sms') return parseSmsJson(parsed);
  if (platform === 'whatsapp') return parseWhatsAppJson(parsed);
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
