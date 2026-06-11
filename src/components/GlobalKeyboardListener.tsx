'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuickCreate } from '@/contexts/QuickCreateContext';
import { useShortcutsHelp } from '@/contexts/ShortcutsHelpContext';
import { useClientNavigate } from '@/hooks/useClientNavigate';
import { getStoredShortcuts, saveStoredShortcuts, ShortcutConfig } from '@/utils/shortcuts';

/**
 * Trình lắng nghe phím tắt toàn cục.
 * Hỗ trợ các phím tắt điều hướng tuần tự và phím tắt đơn lẻ.
 * Tự động đồng bộ với Supabase khi khởi chạy nếu có người dùng đăng nhập.
 */
export default function GlobalKeyboardListener() {
  const { isOpen: isQuickCreateOpen, open: openQuickCreate } = useQuickCreate();
  const { isOpen: isHelpOpen, open: openHelp } = useShortcutsHelp();
  const { navigate } = useClientNavigate();

  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(getStoredShortcuts());
  const shortcutsRef = useRef<ShortcutConfig>(shortcuts);
  const lastKeyRef = useRef<{ key: string; time: number } | null>(null);

  // Giữ ref luôn cập nhật để tránh stale closure trong addEventListener
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Đồng bộ đầu tiên với Supabase và lắng nghe sự kiện cập nhật
  useEffect(() => {
    const handleUpdateEvent = () => {
      setShortcuts(getStoredShortcuts());
    };

    window.addEventListener('mindlabs-shortcuts-updated', handleUpdateEvent);

    // Đồng bộ đầu tiên từ Supabase
    const checkSupabaseShortcuts = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('user_settings')
            .select('keyboard_shortcuts')
            .eq('id', user.id)
            .single();

          if (!error && data && data.keyboard_shortcuts) {
            const remoteShortcuts = data.keyboard_shortcuts as ShortcutConfig;
            setShortcuts(remoteShortcuts);
            saveStoredShortcuts(remoteShortcuts);
          } else if (user.id) {
            const local = getStoredShortcuts();
            await supabase
              .from('user_settings')
              .upsert({
                id: user.id,
                keyboard_shortcuts: local
              }, { onConflict: 'id' });
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải phím tắt từ Supabase:', err);
      }
    };
    
    checkSupabaseShortcuts();

    return () => {
      window.removeEventListener('mindlabs-shortcuts-updated', handleUpdateEvent);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua khi các modal đang mở
      if (isQuickCreateOpen || isHelpOpen) return;

      // Bỏ qua khi đang nhập liệu
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) return;

      // Bỏ qua khi có modifier keys
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const now = Date.now();
      const lastKey = lastKeyRef.current;
      const currentShortcuts = shortcutsRef.current;

      // Kiểm tra nếu phím trước đó được nhấn quá 1 giây thì reset
      if (lastKey && now - lastKey.time > 1000) {
        lastKeyRef.current = null;
      }

      // Xử lý chuỗi tuần tự bắt đầu bằng phím tiền tố
      if (lastKeyRef.current?.key === currentShortcuts.prefix) {
        let navigated = true;
        const inputKey = e.key.toLowerCase();

        switch (inputKey) {
          case currentShortcuts.tasks:
            navigate('/tasks');
            break;
          case currentShortcuts.workspace:
            navigate('/workspace');
            break;
          case currentShortcuts.graph:
            navigate('/graph');
            break;
          case currentShortcuts.pomodoro:
            navigate('/pomodoro');
            break;
          case currentShortcuts.productivity:
            navigate('/productivity');
            break;
          case currentShortcuts.okrs:
            navigate('/okrs');
            break;
          default: {
            const matchedBookmark = (currentShortcuts.custom_bookmarks || []).find(
              (b) => b.key === inputKey
            );
            if (matchedBookmark) {
              if (matchedBookmark.type === 'project') {
                navigate(`/project/${matchedBookmark.target_id}`);
              } else if (matchedBookmark.type === 'cycle') {
                navigate(`/cycle/${matchedBookmark.target_id}`);
              }
            } else {
              navigated = false;
            }
          }
        }

        if (navigated) {
          e.preventDefault();
          lastKeyRef.current = null;
          return;
        }
      }

      // Ghi nhận phím tiền tố
      if (e.key.toLowerCase() === currentShortcuts.prefix) {
        lastKeyRef.current = { key: currentShortcuts.prefix, time: now };
        return;
      }

      // Phím đơn lẻ: mở khung Tạo nhanh
      if (e.key.toLowerCase() === currentShortcuts.quickCreate) {
        e.preventDefault();
        lastKeyRef.current = null;
        openQuickCreate();
        return;
      }

      // Phím đơn lẻ: mở bảng trợ giúp phím tắt
      if (e.key === currentShortcuts.help || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        lastKeyRef.current = null;
        openHelp();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickCreateOpen, isHelpOpen, openQuickCreate, openHelp, navigate]);

  return null;
}
