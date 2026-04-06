import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { MessageData, createEmptyMessage, Platform } from '@/lib/message-builder';

const STORAGE_KEY = 'omni-builder-draft';

function loadDraft(): MessageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...createEmptyMessage(), ...parsed };
    }
  } catch {}
  return createEmptyMessage();
}

function saveDraft(msg: MessageData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msg));
  } catch {}
}

interface MessageContextType {
  message: MessageData;
  setMessage: React.Dispatch<React.SetStateAction<MessageData>>;
  updateField: <K extends keyof MessageData>(key: K, value: MessageData[K]) => void;
  setPlatform: (p: Platform) => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<MessageData>(loadDraft);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(message), 300);
    return () => clearTimeout(saveTimer.current);
  }, [message]);

  const updateField = useCallback(<K extends keyof MessageData>(key: K, value: MessageData[K]) => {
    setMessage(prev => ({ ...prev, [key]: value }));
  }, []);

  const setPlatform = useCallback((p: Platform) => {
    setMessage(prev => ({ ...prev, platform: p }));
  }, []);

  return (
    <MessageContext.Provider value={{ message, setMessage, updateField, setPlatform }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessage() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error('useMessage must be used within MessageProvider');
  return ctx;
}
