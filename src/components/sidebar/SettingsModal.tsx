'use client'

import React, { useState, useEffect } from 'react'
import { User as UserIcon, Paintbrush, X, ChevronDown, ShieldCheck, Database, Cloud, Keyboard, RotateCcw, Trash2, Plus } from 'lucide-react'
import { ShortcutConfig, DEFAULT_SHORTCUTS, getStoredShortcuts, saveStoredShortcuts, SHORTCUT_ACTIONS_METADATA, CustomBookmark } from '@/utils/shortcuts'
import { useLocalProjects, useLocalCycles } from '@/lib/local-first/useLocalTasks'

type Theme = 'light' | 'dark' | 'system'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  fontSize: string
  onFontSizeChange: (size: string) => void
  user: any
}

interface CustomSelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options: CustomSelectOption[]
  value: string
  onChange: (value: any) => void
}

function CustomSelect({ options, value, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeOption = options.find(o => o.value === value) || options[0]

  return (
    <div className="relative inline-block text-left select-none shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[130px] bg-surface border border-border-main rounded-md text-[13px] font-normal text-foreground hover:bg-hover-bg transition-all active:scale-[0.98] cursor-pointer focus:outline-none"
      >
        <span className="truncate">{activeOption.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-foreground/75 dark:text-zinc-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-full min-w-[130px] bg-surface border border-border-main rounded-md py-1 shadow-overlay z-50 animate-in fade-in zoom-in-95 duration-100">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 text-[13px] transition-colors cursor-pointer block focus:outline-none ${
                  option.value === value
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'text-foreground/80 hover:bg-hover-bg hover:text-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  user,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'shortcuts'>('account')
  const [isDriveConnected, setIsDriveConnected] = useState<boolean | null>(null)

  const { projects } = useLocalProjects()
  const { cycles } = useLocalCycles()

  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(DEFAULT_SHORTCUTS)
  const [recordingAction, setRecordingAction] = useState<keyof ShortcutConfig | null>(null)
  const [recordingBookmarkId, setRecordingBookmarkId] = useState<string | null>(null)

  const [newBookmarkType, setNewBookmarkType] = useState<'project' | 'cycle'>('project')
  const [newBookmarkTargetId, setNewBookmarkTargetId] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setShortcuts(getStoredShortcuts())
    }
  }, [isOpen])

  useEffect(() => {
    if (!recordingAction && !recordingBookmarkId) return

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (['Control', 'Shift', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) {
        if (e.key === 'Escape') {
          setRecordingAction(null)
          setRecordingBookmarkId(null)
        }
        return
      }

      e.preventDefault()
      e.stopPropagation()

      const newKey = e.key.toLowerCase()
      let updatedShortcuts = { ...shortcuts }

      if (recordingAction) {
        updatedShortcuts = {
          ...shortcuts,
          [recordingAction]: newKey,
        }
      } else if (recordingBookmarkId) {
        updatedShortcuts = {
          ...shortcuts,
          custom_bookmarks: (shortcuts.custom_bookmarks || []).map(b => 
            b.id === recordingBookmarkId ? { ...b, key: newKey } : b
          )
        }
      }

      setShortcuts(updatedShortcuts)
      saveStoredShortcuts(updatedShortcuts)

      // Sync to Supabase if logged in
      if (user && user.id) {
        try {
          const { createClient } = await import('@/utils/supabase/client')
          const supabase = createClient()
          await supabase
            .from('user_settings')
            .upsert({
              id: user.id,
              keyboard_shortcuts: updatedShortcuts
            }, { onConflict: 'id' })
        } catch (err) {
          console.error('Lỗi khi lưu phím tắt lên Supabase:', err)
        }
      }

      setRecordingAction(null)
      setRecordingBookmarkId(null)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [recordingAction, recordingBookmarkId, shortcuts, user])

  const getUnusedKey = (currentShortcuts: ShortcutConfig) => {
    const usedKeys = new Set<string>()
    usedKeys.add(currentShortcuts.prefix)
    usedKeys.add(currentShortcuts.tasks)
    usedKeys.add(currentShortcuts.workspace)
    usedKeys.add(currentShortcuts.graph)
    usedKeys.add(currentShortcuts.pomodoro)
    usedKeys.add(currentShortcuts.projects)
    usedKeys.add(currentShortcuts.productivity)
    usedKeys.add(currentShortcuts.okrs)
    usedKeys.add(currentShortcuts.quickCreate)
    usedKeys.add(currentShortcuts.help)
    
    ;(currentShortcuts.custom_bookmarks || []).forEach(b => usedKeys.add(b.key))

    for (let i = 1; i <= 9; i++) {
      if (!usedKeys.has(i.toString())) return i.toString()
    }

    const alphabet = 'abcdefghijklmnopqrstuvwxyz'
    for (let char of alphabet) {
      if (!usedKeys.has(char)) return char
    }

    return 'k'
  }

  const handleAddBookmark = async () => {
    if (!newBookmarkTargetId) return

    const targetList = newBookmarkType === 'project' ? (projects || []) : (cycles || [])
    const targetItem = targetList.find((item: any) => item.id === newBookmarkTargetId)
    if (!targetItem) return

    const exists = (shortcuts.custom_bookmarks || []).some(b => b.target_id === newBookmarkTargetId)
    if (exists) {
      alert('Đối tượng này đã được ghim phím tắt!')
      return
    }

    const key = getUnusedKey(shortcuts)
    const newBookmark: CustomBookmark = {
      id: Math.random().toString(36).substring(2, 9),
      type: newBookmarkType,
      target_id: newBookmarkTargetId,
      name: targetItem.name || (newBookmarkType === 'project' ? 'Untitled Project' : 'Untitled Cycle'),
      key
    }

    const updatedShortcuts = {
      ...shortcuts,
      custom_bookmarks: [...(shortcuts.custom_bookmarks || []), newBookmark]
    }

    setShortcuts(updatedShortcuts)
    saveStoredShortcuts(updatedShortcuts)

    // Sync to Supabase
    if (user && user.id) {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        await supabase
          .from('user_settings')
          .upsert({
            id: user.id,
            keyboard_shortcuts: updatedShortcuts
          }, { onConflict: 'id' })
      } catch (err) {
        console.error('Lỗi khi lưu phím tắt ghim lên Supabase:', err)
      }
    }

    setNewBookmarkTargetId('')
  }

  const handleDeleteBookmark = async (id: string) => {
    const updatedBookmarks = (shortcuts.custom_bookmarks || []).filter(b => b.id !== id)
    const updatedShortcuts = {
      ...shortcuts,
      custom_bookmarks: updatedBookmarks
    }

    setShortcuts(updatedShortcuts)
    saveStoredShortcuts(updatedShortcuts)

    // Sync to Supabase
    if (user && user.id) {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        await supabase
          .from('user_settings')
          .upsert({
            id: user.id,
            keyboard_shortcuts: updatedShortcuts
          }, { onConflict: 'id' })
      } catch (err) {
        console.error('Lỗi khi xóa phím tắt ghim lên Supabase:', err)
      }
    }
  }

  const handleResetShortcuts = async () => {
    setShortcuts(DEFAULT_SHORTCUTS)
    saveStoredShortcuts(DEFAULT_SHORTCUTS)

    if (user && user.id) {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        await supabase
          .from('user_settings')
          .upsert({
            id: user.id,
            keyboard_shortcuts: DEFAULT_SHORTCUTS
          }, { onConflict: 'id' })
      } catch (err) {
        console.error('Lỗi khi reset phím tắt trên Supabase:', err)
      }
    }
  }

  useEffect(() => {
    async function checkDrive() {
      try {
        const res = await fetch('/api/gdrive/token')
        setIsDriveConnected(res.ok)
      } catch {
        setIsDriveConnected(false)
      }
    }
    if (isOpen) {
      checkDrive()
    }
  }, [isOpen])

  if (!isOpen) return null

  const displayName = user?.name || user?.email?.split('@')[0] || 'Workspace'
  const email = user?.email || 'local@leanity.app'

  // Get stable colors for avatar matching SidebarHeader
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-pink-500 text-white',
      'bg-purple-500 text-white',
      'bg-indigo-500 text-white',
      'bg-blue-500 text-white',
      'bg-emerald-500 text-white',
      'bg-amber-500 text-white',
      'bg-rose-500 text-white',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const getInitials = (name: string) => {
    if (!name) return 'WS'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const initials = getInitials(displayName)
  const avatarBg = getAvatarColor(displayName)

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ]

  const fontSizeOptions = [
    { value: '12px', label: '12px' },
    { value: '13px', label: 'Default' },
    { value: '14px', label: '14px' },
    { value: '15px', label: '15px' },
    { value: '16px', label: '16px' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[100] flex items-center justify-center animate-in fade-in duration-200 p-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Settings Modal Container */}
      <div className="relative bg-surface border border-border-main rounded-md w-full max-w-[1020px] h-[660px] max-h-[95vh] shadow-overlay z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Sidebar Menu (Width: 260px) */}
        <div className="w-full md:w-[260px] bg-zinc-50/50 dark:bg-zinc-950/40 border-b md:border-b-0 md:border-r border-border-main p-6 shrink-0 flex flex-col justify-between">
          <div className="space-y-8">
            {/* Sidebar Title */}
            <div>
              <h2 className="text-[11px] font-medium text-foreground dark:text-zinc-500 uppercase tracking-widest px-2.5">
                Settings
              </h2>
            </div>

            {/* Menu Items */}
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 cursor-pointer focus:outline-none ${
                  activeTab === 'account'
                    ? 'bg-zinc-200/60 dark:bg-zinc-800/80 text-foreground'
                    : 'text-foreground/70 dark:text-zinc-400 hover:text-foreground hover:bg-hover-bg'
                }`}
              >
                <UserIcon className="w-4 h-4 shrink-0 text-foreground/60 dark:text-zinc-400" strokeWidth={1.5} />
                <span>Account</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 cursor-pointer focus:outline-none ${
                  activeTab === 'appearance'
                    ? 'bg-zinc-200/60 dark:bg-zinc-800/80 text-foreground'
                    : 'text-foreground/70 dark:text-zinc-400 hover:text-foreground hover:bg-hover-bg'
                }`}
              >
                <Paintbrush className="w-4 h-4 shrink-0 text-foreground/60 dark:text-zinc-400" strokeWidth={1.5} />
                <span>Appearance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('shortcuts')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 cursor-pointer focus:outline-none ${
                  activeTab === 'shortcuts'
                    ? 'bg-zinc-200/60 dark:bg-zinc-800/80 text-foreground'
                    : 'text-foreground/70 dark:text-zinc-400 hover:text-foreground hover:bg-hover-bg'
                }`}
              >
                <Keyboard className="w-4 h-4 shrink-0 text-foreground/60 dark:text-zinc-400" strokeWidth={1.5} />
                <span>Shortcuts</span>
              </button>
            </nav>
          </div>

          {/* Footer Info inside Left Sidebar */}
          <div className="hidden md:block px-2.5 py-1 text-[13px] text-foreground/60 dark:text-zinc-500 font-normal">
            Leanity App v1.0.0
          </div>
        </div>

        {/* Right Content Panel (flex-1) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface relative">
          {/* Close Button Top Right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-hover-bg rounded-md text-foreground/60 dark:text-zinc-400 hover:text-foreground transition-all duration-150 cursor-pointer z-10 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12">
            
            {/* Account Tab Content */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Section Header */}
                <div>
                  <h3 className="text-[18px] font-medium text-foreground">Account</h3>
                  <p className="text-[13px] text-foreground/80 dark:text-zinc-400 mt-1 font-normal">
                    Manage your personal profile and sync status.
                  </p>
                </div>

                <div className="h-px bg-border-main" />

                {/* Profile Row Card */}
                <div className="p-5 rounded-md border border-border-main bg-zinc-50/20 dark:bg-zinc-950/10 flex items-center justify-between">
                  <div className="flex items-center gap-4.5">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium shadow-sm ${avatarBg}`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-foreground text-[13px] truncate">{displayName}</h4>
                      <p className="text-[13px] text-foreground/70 dark:text-zinc-400 truncate mt-0.5 font-normal">{email}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[13px] font-normal bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    Local Mode
                  </span>
                </div>

                {/* System Settings Status Rows */}
                <div className="space-y-4">
                  <h4 className="text-[13px] font-medium text-foreground/50 dark:text-zinc-500 uppercase tracking-wider">
                    System Information
                  </h4>
                  
                  <div className="space-y-2.5">
                    <div className="p-4.5 rounded-md border border-border-main bg-surface flex items-center justify-between">
                      <div>
                        <h5 className="text-[13px] font-medium text-foreground">Database</h5>
                      </div>
                      <span className="text-[13px] font-normal text-foreground flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                        IndexedDB
                      </span>
                    </div>

                    <div className="p-4.5 rounded-md border border-border-main bg-surface flex items-center justify-between">
                      <div>
                        <h5 className="text-[13px] font-medium text-foreground">Google Drive Sync</h5>
                      </div>
                      {isDriveConnected === null ? (
                        <span className="text-[13px] font-normal text-foreground/40">Checking...</span>
                      ) : isDriveConnected ? (
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[11px] font-medium border border-emerald-500/20">
                            Connected
                          </span>
                          <a
                            href="/api/gdrive/connect"
                            onClick={onClose}
                            className="text-[13px] text-foreground/60 hover:text-foreground font-medium underline cursor-pointer"
                          >
                            Manage
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-500 text-[11px] font-medium border border-zinc-500/20">
                            Not Connected
                          </span>
                          <a
                            href="/api/gdrive/connect"
                            onClick={onClose}
                            className="text-[13px] text-primary hover:underline font-bold cursor-pointer"
                          >
                            Connect
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab Content */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Section Header */}
                <div>
                  <h3 className="text-[18px] font-medium text-foreground">Appearance</h3>
                  <p className="text-[13px] text-foreground/80 dark:text-zinc-400 mt-1 font-normal">
                    Configure the app's visual theme and text sizes.
                  </p>
                </div>

                <div className="h-px bg-border-main" />

                {/* Appearance Rows Container (Bento style rounded-md cards) */}
                <div className="space-y-4">
                  
                  {/* Theme Select Row */}
                  <div className="p-5 rounded-md border border-border-main bg-zinc-50/10 dark:bg-zinc-950/5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-medium text-foreground">Interface theme</h4>
                    </div>
                    <CustomSelect
                      options={themeOptions}
                      value={theme}
                      onChange={onThemeChange}
                    />
                  </div>

                  {/* Font Size Select Row */}
                  <div className="p-5 rounded-md border border-border-main bg-zinc-50/10 dark:bg-zinc-950/5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-medium text-foreground">Font size</h4>
                    </div>
                    <CustomSelect
                      options={fontSizeOptions}
                      value={fontSize}
                      onChange={onFontSizeChange}
                    />
                  </div>

                </div>
              </div>
            )}

            {/* Shortcuts Tab Content */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Section Header */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[18px] font-medium text-foreground">Shortcuts</h3>
                    <p className="text-[13px] text-foreground/80 dark:text-zinc-400 mt-1 font-normal">
                      Tùy chỉnh phím tắt để thao tác nhanh và chuyển trang trong ứng dụng.
                    </p>
                  </div>
                  <button
                    onClick={handleResetShortcuts}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border-main hover:bg-hover-bg rounded-md text-[12px] font-medium text-secondary hover:text-foreground transition-all duration-150 cursor-pointer focus:outline-none"
                    title="Khôi phục phím tắt mặc định"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục mặc định</span>
                  </button>
                </div>

                <div className="h-px bg-border-main" />

                <div className="space-y-6">
                  {SHORTCUT_ACTIONS_METADATA.map((cat, idx) => (
                    <div key={idx} className="space-y-3">
                      <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                        {cat.category}
                      </h4>
                      <div className="space-y-2">
                        {cat.items.map((item) => {
                          const isRecording = recordingAction === item.id;
                          const keyVal = shortcuts[item.id as keyof ShortcutConfig] || '';
                          return (
                            <div
                              key={item.id}
                              className="p-4 rounded-md border border-border-main bg-zinc-50/10 dark:bg-zinc-950/5 flex items-center justify-between gap-4"
                            >
                              <div className="min-w-0">
                                <h5 className="text-[13px] font-medium text-foreground">{item.name}</h5>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 select-none">
                                {item.isSequence && (
                                  <>
                                    <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-subtle min-w-[24px]">
                                      {shortcuts.prefix}
                                    </kbd>
                                    <span className="text-zinc-400 dark:text-zinc-600 text-xs font-mono">+</span>
                                  </>
                                )}
                                <button
                                  onClick={() => setRecordingAction(item.id as keyof ShortcutConfig)}
                                  className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-mono font-bold rounded-md shadow-subtle min-w-[32px] border transition-all cursor-pointer focus:outline-none ${
                                    isRecording
                                      ? 'bg-primary/10 border-primary text-primary animate-pulse'
                                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                  }`}
                                  title="Nhấp để thay đổi phím tắt"
                                >
                                  {isRecording ? 'Nhấn một phím...' : keyVal.toUpperCase()}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Custom bookmarked shortcuts section */}
                  <div className="space-y-3 pt-4 border-t border-border-main">
                    <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                      Phím tắt tùy chỉnh (Ghim truy cập nhanh)
                    </h4>
                    
                    {/* List of bookmarks */}
                    <div className="space-y-2">
                      {(shortcuts.custom_bookmarks || []).length === 0 ? (
                        <div className="text-xs text-secondary/50 text-center py-4 border border-dashed border-border-main rounded-md">
                          Chưa có phím tắt ghim dự án hoặc chu kỳ nào.
                        </div>
                      ) : (
                        (shortcuts.custom_bookmarks || []).map((bookmark) => {
                          const isRecording = recordingBookmarkId === bookmark.id;
                          return (
                            <div
                              key={bookmark.id}
                              className="p-4 rounded-md border border-border-main bg-zinc-50/10 dark:bg-zinc-950/5 flex items-center justify-between gap-4 animate-in fade-in duration-150"
                            >
                              <div className="min-w-0">
                                <h5 className="text-[13px] font-medium text-foreground flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900">
                                    {bookmark.type === 'project' ? 'Dự án' : 'Chu kỳ'}
                                  </span>
                                  <span className="truncate">{bookmark.name}</span>
                                </h5>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0 select-none">
                                <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-subtle min-w-[24px]">
                                  {shortcuts.prefix}
                                </kbd>
                                <span className="text-zinc-400 dark:text-zinc-600 text-xs font-mono">+</span>
                                <button
                                  onClick={() => setRecordingBookmarkId(bookmark.id)}
                                  className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-mono font-bold rounded-md shadow-subtle min-w-[32px] border transition-all cursor-pointer focus:outline-none ${
                                    isRecording
                                      ? 'bg-primary/10 border-primary text-primary animate-pulse'
                                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                  }`}
                                  title="Nhấp để thay đổi phím tắt"
                                >
                                  {isRecording ? 'Nhấn một phím...' : bookmark.key.toUpperCase()}
                                </button>
                                <button
                                  onClick={() => handleDeleteBookmark(bookmark.id)}
                                  className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer focus:outline-none shrink-0"
                                  title="Xóa phím tắt ghim"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add Bookmark form */}
                    <div className="p-4 rounded-md border border-border-main bg-zinc-50/10 dark:bg-zinc-950/5 space-y-4 pt-4 mt-2">
                      <div className="text-[12px] font-medium text-foreground">Ghim phím tắt mới</div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 min-w-[120px]">
                          <select
                            value={newBookmarkType}
                            onChange={(e) => {
                              setNewBookmarkType(e.target.value as any);
                              setNewBookmarkTargetId('');
                            }}
                            className="w-full px-3 py-1.5 bg-surface border border-border-main rounded-md text-[13px] text-foreground focus:outline-none"
                          >
                            <option value="project">Dự án (Project)</option>
                            <option value="cycle">Chu kỳ (Cycle)</option>
                          </select>
                        </div>
                        
                        <div className="flex-[2] min-w-[180px]">
                          <select
                            value={newBookmarkTargetId}
                            onChange={(e) => setNewBookmarkTargetId(e.target.value)}
                            className="w-full px-3 py-1.5 bg-surface border border-border-main rounded-md text-[13px] text-foreground focus:outline-none"
                          >
                            <option value="">-- Chọn đối tượng để ghim --</option>
                            {newBookmarkType === 'project' ? (
                              (projects || []).map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))
                            ) : (
                              (cycles || []).map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))
                            )}
                          </select>
                        </div>

                        <button
                          onClick={handleAddBookmark}
                          disabled={!newBookmarkTargetId}
                          className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-md shadow-subtle disabled:opacity-40 disabled:hover:bg-primary transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ghim</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
