'use client';
import { createContext, useContext } from 'react';

/** Where a question's detailed editor is drawn: the right panel's "Chi tiết câu" tab, when the editor page provides one. */
type DetailSlot = {
  slot: HTMLElement | null;
  /** A card reports when its detailed editor opens or closes so the panel can show or hide itself. */
  report: (questionId: string, editing: boolean) => void;
};

const Context = createContext<DetailSlot | null>(null);
export const DetailSlotProvider = Context.Provider;
export const useDetailSlot = () => useContext(Context);
