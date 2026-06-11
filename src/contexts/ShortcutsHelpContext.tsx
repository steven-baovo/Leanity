'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface ShortcutsHelpContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ShortcutsHelpContext = createContext<ShortcutsHelpContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function ShortcutsHelpProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ShortcutsHelpContext.Provider value={{ isOpen, open, close }}>
      {children}
    </ShortcutsHelpContext.Provider>
  );
}

export function useShortcutsHelp() {
  return useContext(ShortcutsHelpContext);
}
