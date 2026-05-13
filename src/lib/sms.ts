export type SmsEncoding = 'GSM' | 'UCS2';

export interface SmsInfo {
  len: number;
  parts: number;
  encoding: SmsEncoding;
  perPart: number;
  remaining: number;
}

export function smsParts(text: string): SmsInfo {
  const isUcs2 = /[^\u0000-\u007F]/.test(text);
  const encoding: SmsEncoding = isUcs2 ? 'UCS2' : 'GSM';
  const len = text.length;
  if (!len) {
    const single = isUcs2 ? 70 : 160;
    return { len: 0, parts: 0, encoding, perPart: single, remaining: single };
  }
  if (isUcs2) {
    if (len <= 70) {
      return { len, parts: 1, encoding, perPart: 70, remaining: 70 - len };
    }
    const parts = Math.ceil(len / 67);
    return { len, parts, encoding, perPart: 67, remaining: parts * 67 - len };
  }
  if (len <= 160) {
    return { len, parts: 1, encoding, perPart: 160, remaining: 160 - len };
  }
  const parts = Math.ceil(len / 153);
  return { len, parts, encoding, perPart: 153, remaining: parts * 153 - len };
}
