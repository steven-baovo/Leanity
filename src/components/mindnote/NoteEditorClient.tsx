'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ZenEditor from './ZenEditor'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Plus, Network, Link2, Trash2, FileText } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/local-first/db'
import { useLocalWorkspace } from '@/lib/local-first/useLocalWorkspace'
import { useLocalNotes } from '@/lib/local-first/useLocalNotes'

interface NoteEditorClientProps {
  noteId: string
  onOpenConnectModal?: () => void
}

const NoteEditorClient = ({ noteId, onOpenConnectModal }: NoteEditorClientProps) => {
  const { setActiveId, setTitle, setIsSaving } = useWorkspace()

  // Stable editor state — chỉ được set từ IndexedDB, không bao giờ bị ghi đè bởi useLiveQuery sau khi đã load
  const [title, setLocalTitle] = useState('')
  const [content, setContent] = useState<any>(null)
  const [initialData, setInitialData] = useState<{title: string; content: any} | null>(null)
  const [isLoadingNote, setIsLoadingNote] = useState(true)
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 })

  const { updateNote } = useLocalNotes()
  const { nodes: allNodes, updateNode } = useLocalWorkspace()

  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Tự động căn chỉnh chiều cao tiêu đề ghi chú khi tải hoặc khi tiêu đề thay đổi
  useEffect(() => {
    const textarea = titleTextareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [title])

  // useLiveQuery CHỈ dùng để phát hiện thay đổi title từ bên ngoài (sidebar rename)
  // KHÔNG dùng để drive content của editor
  const note = useLiveQuery(() => db.mind_notes.get(noteId), [noteId])

  const lastLoadedNoteId = useRef<string | null>(null)

  // Load dữ liệu từ IndexedDB một lần duy nhất khi noteId thay đổi
  useEffect(() => {
    setActiveId(noteId)
    setIsLoadingNote(true)
    setInitialData(null)
    lastLoadedNoteId.current = null

    async function loadNote() {
      const localNote = await db.mind_notes.get(noteId)
      if (localNote) {
        setLocalTitle(localNote.title)
        setContent(localNote.content)
        setTitle(localNote.title)
        setInitialData({ title: localNote.title, content: localNote.content })
        lastLoadedNoteId.current = noteId
      }
      setIsLoadingNote(false)
    }

    loadNote()

    return () => {
      setActiveId(null)
      setTitle('')
      setIsSaving(false)
    }
  }, [noteId, setActiveId, setTitle, setIsSaving])

  // Đồng bộ title khi được đổi tên từ sidebar (KHÔNG đụng đến content)
  useEffect(() => {
    if (note && lastLoadedNoteId.current === noteId && note.title !== title) {
      setLocalTitle(note.title)
      setTitle(note.title)
    }
  }, [note?.title]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentNode = useMemo(() => {
    if (!allNodes) return null
    return allNodes.find(n => n.note_id === noteId)
  }, [allNodes, noteId])

  const parentProject = useMemo(() => {
    if (!currentNode?.parent_id) return null
    return allNodes?.find(n => n.id === currentNode.parent_id)
  }, [allNodes, currentNode])

  const linkedNodeIds = currentNode?.connected_node_ids || []

  const allAvailableFiles = useMemo(() => {
    if (!allNodes) return []
    return allNodes
      .filter(n => n.type === 'note' || n.type === 'map')
      .map(n => ({
        id: n.id,
        title: n.title,
        type: n.type as 'note' | 'map'
      }))
  }, [allNodes])

  const [isLinksPanelOpen, setIsLinksPanelOpen] = useState(false)
  const linksPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (linksPanelRef.current && !linksPanelRef.current.contains(event.target as Node)) {
        setIsLinksPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lưu dữ liệu mới nhất vào ref để cleanup function đọc được
  const latestDataRef = useRef({ title, content, initialData, noteId })
  useEffect(() => {
    latestDataRef.current = { title, content, initialData, noteId }
  }, [title, content, initialData, noteId])

  // Lưu ngay lập tức khi unmount hoặc chuyển noteId (tránh mất dữ liệu khi chuyển file nhanh)
  useEffect(() => {
    return () => {
      const { title: t, content: c, initialData: init, noteId: id } = latestDataRef.current
      if (init && id) {
        const hasTitleChanged = t !== init.title
        const hasContentChanged = JSON.stringify(c) !== JSON.stringify(init.content)
        if (hasTitleChanged || hasContentChanged) {
          updateNote(id, { title: t, content: c })
        }
      }
    }
  }, [noteId, updateNote])

  const handleTitleChange = useCallback((newTitle: string) => {
    setLocalTitle(newTitle)
    setTitle(newTitle)
  }, [setTitle])

  // Auto-save debounce 2 giây
  const handleSave = useCallback(async (currentTitle: string, currentContent: any) => {
    setIsSaving(true)
    await updateNote(noteId, { title: currentTitle, content: currentContent })
    setIsSaving(false)
    setInitialData({ title: currentTitle, content: currentContent })
  }, [noteId, setIsSaving, updateNote])

  useEffect(() => {
    if (!initialData) return
    const timer = setTimeout(() => {
      const hasTitleChanged = title !== initialData.title
      const hasContentChanged = JSON.stringify(content) !== JSON.stringify(initialData.content)
      if (hasTitleChanged || hasContentChanged) {
        handleSave(title, content)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [title, content, initialData, handleSave])

  const handleAddLink = async (targetId: string) => {
    if (!currentNode) return
    const updatedLinks = [...linkedNodeIds, targetId]
    await updateNode(currentNode.id, { connected_node_ids: updatedLinks })
  }

  const handleRemoveLink = async (targetId: string) => {
    if (!currentNode) return
    // Xoá phía source
    const updatedLinks = linkedNodeIds.filter(id => id !== targetId)
    await updateNode(currentNode.id, { connected_node_ids: updatedLinks })
    // Xoá phía target (bidirectional) — đảm bảo graph view không hiện link ở chỉều ngược
    const targetNode = allNodes?.find(n => n.id === targetId)
    if (targetNode && Array.isArray(targetNode.connected_node_ids)) {
      const reverseUpdated = targetNode.connected_node_ids.filter(id => id !== currentNode.id)
      await updateNode(targetId, { connected_node_ids: reverseUpdated })
    }
  }

  // Loading state — chỉ hiện spinner nhỏ khi lần đầu load noteId mới
  if (isLoadingNote) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-border-main border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center gap-2 text-secondary">
        <FileText className="w-8 h-8 opacity-30" />
        <p className="text-sm">Không tìm thấy ghi chú này</p>
      </div>
    )
  }

  return (
    <div className="h-full bg-background relative flex flex-col">
      {/* Breadcrumb Header Strip */}
      <header className="w-full flex items-center justify-between px-4 h-[44px] border-b border-border-main bg-background shrink-0 select-none z-10">
        <div className="flex items-center gap-1.5 text-standard tracking-tight text-secondary leading-none">
          <span className="leading-none">
            {parentProject ? parentProject.title : 'Tất cả file'}
          </span>
          <span className="text-zinc-300 leading-none">/</span>
          <span className="font-medium text-standard-text leading-none">
            {title || 'Untitled Note'}
          </span>
        </div>
      </header>

      {/* Phần nội dung cuộn */}
      <div 
        className="flex-1 overflow-y-auto pt-10 pb-[50vh]"
        onClick={(e) => {
          // Focus editor nếu click vào vùng trống dưới cùng
          if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'MAIN' || (e.target as HTMLElement).classList.contains('max-w-3xl')) {
            const editorElement = document.querySelector('.ProseMirror') as HTMLElement
            editorElement?.focus()
            
            // Tùy chọn: Đưa con trỏ xuống cuối document
            // editor.commands.focus('end') cần access vào editor instance, ở đây focus tạm vào element là đủ
          }
        }}
      >
        <main className="px-4 lg:px-24 min-w-0 h-full">
          <div className="max-w-3xl mx-auto h-full">

            {/* Title */}
            <textarea
              ref={titleTextareaRef}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => {
                if (initialData && title !== initialData.title) handleSave(title, content)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.nativeEvent.isComposing) return
                  e.preventDefault()
                  e.currentTarget.blur()
                  setTimeout(() => {
                    const editorElement = document.querySelector('.ProseMirror') as HTMLElement
                    editorElement?.focus()
                  }, 100)
                }
              }}
              placeholder="Untitled Note"
              className="w-full text-3xl font-bold tracking-tight text-foreground border-none outline-none mb-4 placeholder:text-secondary/30 resize-none overflow-hidden"
              rows={1}
            />

            {/* Editor — key={noteId} tạo instance Tiptap mới khi đổi file
                initialContent={content} dùng state ổn định, KHÔNG phải note.content từ useLiveQuery */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <ZenEditor
                noteId={noteId}
                initialContent={content}
                onChange={setContent}
                onCountChange={(words, chars) => setWordCount({ words, chars })}
              />
            </div>

          </div>
        </main>
      </div>

      {/* Section Kết nối */}
      <div className="absolute bottom-6 right-6 z-50">
        <button
          onClick={() => setIsLinksPanelOpen(!isLinksPanelOpen)}
          className={`p-2.5 rounded-xl transition-colors bg-surface/90 backdrop-blur-md border border-border-main flex items-center gap-2 group ${isLinksPanelOpen ? 'text-primary' : 'text-foreground hover:bg-hover-bg'}`}
          title="Liên kết Graph View"
        >
          <Link2 className="w-5 h-5" />
          <span className="text-sm font-medium">Liên kết</span>
        </button>

        {isLinksPanelOpen && (
          <div ref={linksPanelRef} className="absolute bottom-full right-0 mb-2 bg-surface/95 backdrop-blur-md rounded-xl border border-border-main p-4 w-72 max-h-80 flex flex-col z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 shadow-overlay">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-foreground">Liên kết Graph View</h4>
              <span className="text-xs text-secondary">{linkedNodeIds.length} đã nối</span>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto mb-3 border-b border-border-main pb-3">
              {linkedNodeIds.length === 0 ? (
                <p className="text-xs text-secondary italic text-center py-2">Chưa có liên kết nào.</p>
              ) : (
                linkedNodeIds.map(id => {
                  const file = allAvailableFiles.find(f => f.id === id)
                  return (
                    <div key={id} className="flex items-center justify-between text-xs p-2 bg-active-bg/20 hover:bg-hover-bg rounded-lg transition-colors border border-border-main/50">
                      <span className="truncate flex-1 mr-2 flex items-center gap-1.5 font-medium text-foreground">
                        {file?.type === 'note' ? <FileText className="w-3.5 h-3.5 text-secondary" /> : <Network className="w-3.5 h-3.5 text-secondary" />}
                        {file?.title || id}
                      </span>
                      <button
                        onClick={() => handleRemoveLink(id)}
                        className="text-secondary/50 hover:text-red-500 p-1 rounded-md hover:bg-hover-bg transition-colors"
                        title="Xóa liên kết"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <div>
              <h5 className="text-xs font-semibold text-secondary mb-2">Thêm liên kết mới:</h5>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {allAvailableFiles.filter(f => f.id !== currentNode?.id && !linkedNodeIds.includes(f.id)).length === 0 ? (
                  <p className="text-xs text-secondary italic text-center py-2">Không có file nào khả dụng</p>
                ) : (
                  allAvailableFiles
                    .filter(f => f.id !== currentNode?.id && !linkedNodeIds.includes(f.id))
                    .map(f => (
                      <button
                        key={f.id}
                        onClick={() => handleAddLink(f.id)}
                        className="w-full text-left px-2 py-1.5 text-xs rounded-lg hover:bg-hover-bg transition-colors flex items-center justify-between group border border-transparent hover:border-border-main"
                      >
                        <span className="truncate flex-1 flex items-center gap-1.5 text-secondary group-hover:text-foreground">
                          {f.type === 'note' ? <FileText className="w-3.5 h-3.5 text-secondary" /> : <Network className="w-3.5 h-3.5 text-secondary" />}
                          {f.title}
                        </span>
                        <Plus className="w-3.5 h-3.5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bộ đếm số từ */}
      <div className="absolute bottom-[5px] left-[5px] z-50">
        <div className="bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-light text-secondary flex gap-3 border border-border-main/50 shadow-subtle">
          <span>{wordCount.words} từ</span>
          <span className="text-border-main">|</span>
          <span>{wordCount.chars} ký tự</span>
        </div>
      </div>
    </div>
  )
}

export default NoteEditorClient
