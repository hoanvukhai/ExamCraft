'use client';
import { useEffect, useState, useRef } from 'react';
import { chatKey, readChat, serializeChat, type ChatSession } from '@/lib/chat-session';
export function useChatSession(ownerId: string, documentId: string) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [notice, setNotice] = useState('');
  const slot = useRef('');
  const writable = useRef(true);
  useEffect(() => {
    let restored: ChatSession = {formatVersion:1, ownerId, documentId, conversationId:crypto.randomUUID(), turns:[], pending:false, draft:''};
    try {
      const writer = sessionStorage.getItem('examcraft:chat-writer') || crypto.randomUUID();
      sessionStorage.setItem('examcraft:chat-writer', writer);
      slot.current = chatKey(ownerId, documentId, writer);
      const raw = localStorage.getItem(slot.current);
      if (raw) restored = readChat(raw, ownerId, documentId);
      if (restored.pending) { restored = {...restored, pending:false}; queueMicrotask(() => setNotice('Lượt trước bị gián đoạn; chưa rõ kết quả. Yêu cầu còn trong lịch sử, chưa tự gọi lại AI.')); }
    } catch { writable.current = false; queueMicrotask(() => setNotice('Chưa đọc được hội thoại trên máy. Bản cũ vẫn được giữ; phiên này chỉ giữ trong bộ nhớ, hãy tải về trước khi đóng.')); }
    // Restore once per mounted owner/document; the caller keys this component by both IDs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(restored);
  }, [ownerId, documentId]);
  useEffect(() => {
    if (!session || !slot.current || !writable.current) return;
    try { localStorage.setItem(slot.current, serializeChat(session)); }
    catch { queueMicrotask(() => setNotice('Chưa giữ được hội thoại trên máy. Nội dung còn trong phiên này; hãy tải hội thoại trước khi đóng.')); }
  }, [session]);
  return {session, setSession, notice};
}
