'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Link2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/local-first/db'
import { useLocalWorkspace } from '@/lib/local-first/useLocalWorkspace'
import { useLocalNotes } from '@/lib/local-first/useLocalNotes'
import TableEditor from './TableEditor'

interface TableEditorClientProps {
  noteId: string
  onOpenConnectModal?: () => void
}

const TableEditorClient = ({ noteId, onOpenConnectModal }: TableEditorClientProps) => {
  const { setActiveId, setTitle, setIsSaving } = useWorkspace()

  const [localTitle, setLocalTitle] = useState('')
  const [content, setContent] = useState<any>(null)
  const [initialData, setInitialData] = useState<{title: string; content: any} | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { updateNote } = useLocalNotes()
  const { nodes: allNodes } = useLocalWorkspace()

  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize title textarea
  useEffect(() => {
    const textarea = titleTextareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [localTitle])

  const note = useLiveQuery(() => db.mind_notes.get(noteId), [noteId])
  const lastLoadedNoteId = useRef<string | null>(null)

  // Load note data once on mount or noteId change
  useEffect(() => {
    setActiveId(noteId)
    setIsLoading(true)
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
      setIsLoading(false)
    }

    loadNote()

    return () => {
      setActiveId(null)
      setTitle('')
      setIsSaving(false)
    }
  }, [noteId, setActiveId, setTitle, setIsSaving])

  // Sync title with sidebar renaming
  useEffect(() => {
    if (note && lastLoadedNoteId.current === noteId && note.title !== localTitle) {
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

  // Keep latest data in ref for unmount save
  const latestDataRef = useRef({ title: localTitle, content, initialData, noteId })
  useEffect(() => {
    latestDataRef.current = { title: localTitle, content, initialData, noteId }
  }, [localTitle, content, initialData, noteId])

  // Unmount save handler
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

  // Save changes
  const handleSave = useCallback(async (currentTitle: string, currentContent: any) => {
    setIsSaving(true)
    await updateNote(noteId, { title: currentTitle, content: currentContent })
    setIsSaving(false)
    setInitialData({ title: currentTitle, content: currentContent })
  }, [noteId, setIsSaving, updateNote])

  // Auto-save debounce (2 seconds)
  useEffect(() => {
    if (!initialData) return
    const timer = setTimeout(() => {
      const hasTitleChanged = localTitle !== initialData.title
      const hasContentChanged = JSON.stringify(content) !== JSON.stringify(initialData.content)
      if (hasTitleChanged || hasContentChanged) {
        handleSave(localTitle, content)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [localTitle, content, initialData, handleSave])

  const handleTableChange = useCallback((newTableContent: any) => {
    setContent(newTableContent)
  }, [])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden relative">
      <header className="flex items-center justify-between px-4 h-[44px] border-b border-border-main shrink-0 bg-background/80 backdrop-blur-md z-30 select-none">
        <div className="flex items-center gap-1.5 text-standard tracking-tight text-secondary leading-none">
          <span className="leading-none">
            {parentProject ? parentProject.title : 'Tất cả file'}
          </span>
          <span className="text-zinc-300 leading-none">/</span>
          <span className="font-medium text-standard-text leading-none">
            {localTitle || 'Untitled Table'}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 bg-background">
        <main className="px-4 lg:px-24 min-w-0 py-8">
          <div className="max-w-4xl mx-auto">


            {/* Title Area */}
            <textarea
              ref={titleTextareaRef}
              value={localTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => {
                if (initialData && localTitle !== initialData.title) handleSave(localTitle, content)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.nativeEvent.isComposing) return
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              placeholder="Untitled Table"
              className="w-full text-3xl font-bold tracking-tight text-foreground border-none outline-none mb-2 placeholder:text-secondary/30 resize-none overflow-hidden"
              rows={1}
            />



            {/* Main Editable Grid Table */}
            <TableEditor
              data={content}
              onChange={handleTableChange}
            />
          </div>
        </main>
      </div>

      {/* Graph Connect Button */}
      <div className="absolute bottom-6 right-6 z-50">
        <button
          onClick={onOpenConnectModal}
          className="p-2.5 rounded-xl transition-colors bg-surface/90 backdrop-blur-md border border-border-main flex items-center gap-2 group text-foreground hover:bg-hover-bg shadow-floating"
          title="Liên kết Graph View"
        >
          <Link2 className="w-5 h-5 text-secondary group-hover:text-foreground" />
          <span className="text-sm font-medium">Liên kết</span>
        </button>
      </div>
    </div>
  )
}

export default TableEditorClient
