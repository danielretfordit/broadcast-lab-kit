import React, { createContext, useContext, useState, useCallback } from 'react';
import { MessageData, createEmptyMessage, Platform } from '@/lib/message-builder';

interface MessageContextType {
  message: MessageData;
  setMessage: React.Dispatch<React.SetStateAction<MessageData>>;
  updateField: <K extends keyof MessageData>(key: K, value: MessageData[K]) => void;
  setPlatform: (p: Platform) => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<MessageData>(createEmptyMessage());

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
