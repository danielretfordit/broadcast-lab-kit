const MARKDOWN_V2_SPECIAL_CHARS = new Set([
  '_',
  '*',
  '[',
  ']',
  '(',
  ')',
  '~',
  '`',
  '>',
  '#',
  '+',
  '-',
  '=',
  '|',
  '{',
  '}',
  '.',
  '!',
  ':',
]);

const INLINE_MARKERS = ['__', '||', '*', '_', '~'] as const;

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;

  for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) {
    slashCount += 1;
  }

  return slashCount % 2 === 1;
}

function findClosingMarker(text: string, marker: string, startIndex: number): number {
  for (let index = startIndex; index < text.length; index += 1) {
    if (text.startsWith(marker, index) && !isEscaped(text, index)) {
      return index;
    }
  }

  return -1;
}

function parseLink(text: string, startIndex: number): { value: string; nextIndex: number } | null {
  if (text[startIndex] !== '[' || isEscaped(text, startIndex)) {
    return null;
  }

  const textEnd = findClosingMarker(text, ']', startIndex + 1);
  if (textEnd === -1 || text[textEnd + 1] !== '(') {
    return null;
  }

  const urlStart = textEnd + 2;
  const urlEnd = findClosingMarker(text, ')', urlStart);
  if (urlEnd === -1) {
    return null;
  }

  const linkText = text.slice(startIndex + 1, textEnd);
  const linkUrl = text.slice(urlStart, urlEnd);

  return {
    value: `[${prepareMarkdownV2(linkText)}](${linkUrl})`,
    nextIndex: urlEnd + 1,
  };
}

function parseCode(text: string, startIndex: number): { value: string; nextIndex: number } | null {
  if (isEscaped(text, startIndex)) {
    return null;
  }

  const marker = text.startsWith('```', startIndex) ? '```' : text[startIndex] === '`' ? '`' : null;
  if (!marker) {
    return null;
  }

  const endIndex = findClosingMarker(text, marker, startIndex + marker.length);
  if (endIndex === -1) {
    return null;
  }

  return {
    value: text.slice(startIndex, endIndex + marker.length),
    nextIndex: endIndex + marker.length,
  };
}

function parseFormatted(text: string, startIndex: number): { value: string; nextIndex: number } | null {
  if (isEscaped(text, startIndex)) {
    return null;
  }

  const marker = INLINE_MARKERS.find((candidate) => text.startsWith(candidate, startIndex));
  if (!marker) {
    return null;
  }

  const endIndex = findClosingMarker(text, marker, startIndex + marker.length);
  if (endIndex === -1) {
    return null;
  }

  const inner = text.slice(startIndex + marker.length, endIndex);

  return {
    value: `${marker}${prepareMarkdownV2(inner)}${marker}`,
    nextIndex: endIndex + marker.length,
  };
}

export function escapeMarkdownV2Plain(text: string): string {
  let result = '';

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '\\') {
      result += char;

      if (index + 1 < text.length) {
        result += text[index + 1];
        index += 1;
      }

      continue;
    }

    result += MARKDOWN_V2_SPECIAL_CHARS.has(char) ? `\\${char}` : char;
  }

  return result;
}

export function prepareMarkdownV2(rawText: string): string {
  let result = '';
  let index = 0;

  while (index < rawText.length) {
    if (rawText[index] === '\\') {
      result += rawText[index];

      if (index + 1 < rawText.length) {
        result += rawText[index + 1];
        index += 2;
      } else {
        index += 1;
      }

      continue;
    }

    const parsedLink = parseLink(rawText, index);
    if (parsedLink) {
      result += parsedLink.value;
      index = parsedLink.nextIndex;
      continue;
    }

    const parsedCode = parseCode(rawText, index);
    if (parsedCode) {
      result += parsedCode.value;
      index = parsedCode.nextIndex;
      continue;
    }

    const parsedFormatted = parseFormatted(rawText, index);
    if (parsedFormatted) {
      result += parsedFormatted.value;
      index = parsedFormatted.nextIndex;
      continue;
    }

    let plainEnd = index + 1;

    while (plainEnd < rawText.length) {
      if (rawText[plainEnd] === '\\') break;
      if (rawText[plainEnd] === '[' || rawText[plainEnd] === '`') break;
      if (INLINE_MARKERS.some((marker) => rawText.startsWith(marker, plainEnd))) break;
      plainEnd += 1;
    }

    result += escapeMarkdownV2Plain(rawText.slice(index, plainEnd));
    index = plainEnd;
  }

  return result;
}