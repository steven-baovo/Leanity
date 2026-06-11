'use client';

export interface CustomBookmark {
  id: string;
  type: 'project' | 'cycle';
  target_id: string;
  name: string;
  key: string;
}

export interface ShortcutConfig {
  prefix: string;        // default: 'g' (Go prefix)
  tasks: string;         // default: 't' (sequence after prefix)
  workspace: string;     // default: 'w' (sequence after prefix)
  graph: string;         // default: 'g' (sequence after prefix)
  pomodoro: string;      // default: 'p' (sequence after prefix)
  productivity: string;  // default: 'r' (sequence after prefix)
  okrs: string;          // default: 'o' (sequence after prefix)
  quickCreate: string;   // default: 'c' (single key)
  help: string;          // default: '?' (single key)
  custom_bookmarks: CustomBookmark[];
}

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  prefix: 'g',
  tasks: 't',
  workspace: 'w',
  graph: 'g',
  pomodoro: 'p',
  productivity: 'r',
  okrs: 'o',
  quickCreate: 'c',
  help: '?',
  custom_bookmarks: []
};

export const SHORTCUTS_STORAGE_KEY = 'mindlabs-shortcuts-v1';

export function getStoredShortcuts(): ShortcutConfig {
  if (typeof window === 'undefined') return DEFAULT_SHORTCUTS;
  try {
    const stored = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!stored) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_SHORTCUTS, ...parsed };
  } catch (e) {
    console.error('Failed to load shortcuts from localStorage:', e);
    return DEFAULT_SHORTCUTS;
  }
}

export function saveStoredShortcuts(config: ShortcutConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('mindlabs-shortcuts-updated'));
  } catch (e) {
    console.error('Failed to save shortcuts to localStorage:', e);
  }
}

export const SHORTCUT_ACTIONS_METADATA = [
  {
    category: 'Điều hướng (Chuyển trang)',
    items: [
      { id: 'tasks', name: 'Task Center', isSequence: true },
      { id: 'workspace', name: 'Workspace (Library)', isSequence: true },
      { id: 'graph', name: 'Graph View', isSequence: true },
      { id: 'pomodoro', name: 'Pomodoro Focus', isSequence: true },
      { id: 'productivity', name: 'Báo cáo năng suất', isSequence: true },
      { id: 'okrs', name: 'OKRs', isSequence: true },
    ]
  },
  {
    category: 'Cấu hình tiền tố & Phím chức năng',
    items: [
      { id: 'prefix', name: 'Phím tiền tố điều hướng', isSequence: false },
      { id: 'quickCreate', name: 'Mở khung Tạo nhiệm vụ mới', isSequence: false },
      { id: 'help', name: 'Mở bảng Hướng dẫn phím tắt', isSequence: false },
    ]
  }
];
