import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { MessageData, createEmptyMessage, Platform } from '@/lib/message-builder';

function defaultParseMode(platform: Platform): MessageData['parseMode'] {
  if (platform === 'html') return 'HTML';
  if (platform === 'max') return 'Markdown';
  return 'MarkdownV2';
}

const STORAGE_PREFIX = 'omni-builder-draft:';

function storageKey(platform: Platform) {
  return `${STORAGE_PREFIX}${platform}`;
}

function loadDraft(platform: Platform): MessageData {
  try {
    const raw = localStorage.getItem(storageKey(platform));
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migration: ensure mediaUrls exists
      const merged = { ...createEmptyMessage(), ...parsed, platform };
      if (!Array.isArray(merged.mediaUrls)) merged.mediaUrls = [];
      return merged;
    }
  } catch {}
  const empty = createEmptyMessage();
  return { ...empty, platform, parseMode: platform === 'html' ? 'HTML' : empty.parseMode };
}

function saveDraft(msg: MessageData) {
  try {
    localStorage.setItem(storageKey(msg.platform), JSON.stringify(msg));
  } catch {}
}

interface MessageContextType {
  message: MessageData;
  setMessage: React.Dispatch<React.SetStateAction<MessageData>>;
  updateField: <K extends keyof MessageData>(key: K, value: MessageData[K]) => void;
  setPlatform: (p: Platform) => void;
  resetDraft: () => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

interface MessageProviderProps {
  children: React.ReactNode;
  initialPlatform?: Platform;
  skipPersistence?: boolean;
}

export function MessageProvider({ children, initialPlatform, skipPersistence }: MessageProviderProps) {
  const [message, setMessage] = useState<MessageData>(() => {
    if (skipPersistence) {
      const empty = createEmptyMessage();
      const platform = initialPlatform || 'telegram';
      return { ...empty, platform, parseMode: platform === 'html' ? 'HTML' : empty.parseMode };
    }
    return loadDraft(initialPlatform || 'telegram');
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (skipPersistence) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(message), 300);
    return () => clearTimeout(saveTimer.current);
  }, [message, skipPersistence]);

  const updateField = useCallback(<K extends keyof MessageData>(key: K, value: MessageData[K]) => {
    setMessage(prev => ({ ...prev, [key]: value }));
  }, []);

  const setPlatform = useCallback((p: Platform) => {
    setMessage(prev => {
      // Save current platform draft before switching
      if (!skipPersistence) saveDraft(prev);
      // Load draft for the new platform (or empty)
      const next = loadDraft(p);
      return next;
    });
  }, [skipPersistence]);

  const resetDraft = useCallback(() => {
    setMessage(prev => {
      const empty = createEmptyMessage();
      const next: MessageData = {
        ...empty,
        platform: prev.platform,
        parseMode: prev.platform === 'html' ? 'HTML' : empty.parseMode,
      };
      try { localStorage.removeItem(storageKey(prev.platform)); } catch {}
      return next;
    });
  }, []);

  return (
    <MessageContext.Provider value={{ message, setMessage, updateField, setPlatform, resetDraft }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessage() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error('useMessage must be used within MessageProvider');
  return ctx;
}
