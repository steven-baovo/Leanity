'use client';

import React, { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useShortcutsHelp } from '@/contexts/ShortcutsHelpContext';
import { getStoredShortcuts, SHORTCUT_ACTIONS_METADATA } from '@/utils/shortcuts';

export default function ShortcutsHelpModal() {
  const { isOpen, close } = useShortcutsHelp();
  const [shortcuts, setShortcuts] = useState(getStoredShortcuts());

  useEffect(() => {
    if (!isOpen) return;

    // Load fresh shortcuts when opening
    setShortcuts(getStoredShortcuts());

    // Listen to changes
    const handleUpdate = () => {
      setShortcuts(getStoredShortcuts());
    };

    window.addEventListener('mindlabs-shortcuts-updated', handleUpdate);
    return () => window.removeEventListener('mindlabs-shortcuts-updated', handleUpdate);
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-[600] p-4 animate-in fade-in duration-200"
      onClick={close}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-overlay flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 select-none">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Keyboard className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span>Phím tắt bàn phím</span>
          </div>
          <button
            onClick={close}
            className="p-1 rounded-md text-zinc-400 hover:text-foreground hover:bg-hover-bg transition-colors cursor-pointer focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[70vh] no-scrollbar">
          {SHORTCUT_ACTIONS_METADATA.map((cat, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {cat.category}
              </h4>
              <div className="space-y-2">
                {cat.items.map((item) => {
                  const key = shortcuts[item.id as keyof typeof shortcuts] || '';
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <span className="text-[13px] text-zinc-700 dark:text-zinc-300 font-normal">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {item.isSequence ? (
                          <>
                            <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-subtle min-w-[24px]">
                              {shortcuts.prefix}
                            </kbd>
                            <span className="text-zinc-400 dark:text-zinc-600 text-xs font-mono">+</span>
                            <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-subtle min-w-[24px] capitalize">
                              {key}
                            </kbd>
                          </>
                        ) : (
                          <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-subtle min-w-[24px] capitalize">
                            {key === '?' ? '?' : key}
                          </kbd>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {shortcuts.custom_bookmarks && shortcuts.custom_bookmarks.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Phím tắt tùy chỉnh (Đã ghim)
              </h4>
              <div className="space-y-2">
                {shortcuts.custom_bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <span className="text-[13px] text-zinc-700 dark:text-zinc-300 font-normal flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900">
                        {bookmark.type === 'project' ? 'Dự án' : 'Chu kỳ'}
                      </span>
                      <span className="truncate max-w-[200px]">{bookmark.name}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-subtle min-w-[24px]">
                        {shortcuts.prefix}
                      </kbd>
                      <span className="text-zinc-400 dark:text-zinc-600 text-xs font-mono">+</span>
                      <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-subtle min-w-[24px] capitalize">
                        {bookmark.key}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-400 dark:text-zinc-500 font-normal text-center select-none">
          Mẹo: Nhấn phím <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-bold">Esc</kbd> bất kỳ lúc nào để đóng bảng trợ giúp.
        </div>
      </div>
    </div>
  );
}
