'use client'

import React, { useState } from 'react'
import { Handle, Position, NodeToolbar, useReactFlow } from '@xyflow/react'
import { FileText, Trash2, Palette, Check } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/local-first/db'
import { useRouter } from 'next/navigation'

const getDynamicColor = (color: any) => {
  if (!color) return null
  const name = color.name
  if (name === 'Default') return null
  const lowerName = name?.toLowerCase()
  if (['red', 'blue', 'green', 'yellow', 'purple'].includes(lowerName)) {
    return {
      name: color.name,
      border: `var(--node-${lowerName}-border)`,
      bg: `var(--node-${lowerName}-bg)`
    }
  }
  return color
}

export default function NoteNode({ id, data, selected }: { id: string; data: any; selected: boolean }) {
  const router = useRouter()
  const { setNodes } = useReactFlow()
  const [activeMenu, setActiveMenu] = useState<'color' | null>(null)

  const liveNote = useLiveQuery(
    () => (data.noteId ? db.mind_notes.get(data.noteId) : Promise.resolve(null)),
    [data.noteId]
  ) as any

  const displayTitle = liveNote ? liveNote.title : (data.label || 'Untitled Note')
  const displayContent = liveNote !== undefined ? (liveNote ? liveNote.content : null) : data.content

  const normalizedColor = getDynamicColor(data.color)

  const nodeColors = [
    { name: 'Default', border: '#94A3B8', bg: '#ffffff' },
    { name: 'Red', border: '#ef4444', bg: '#fef2f2' },
    { name: 'Blue', border: '#3b82f6', bg: '#eff6ff' },
    { name: 'Green', border: '#22c55e', bg: '#f0fdf4' },
    { name: 'Yellow', border: '#eab308', bg: '#fefce8' },
    { name: 'Purple', border: '#a855f7', bg: '#faf5ff' },
  ]

  const updateNodeColor = (color: { name: string, border: string, bg: string }) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, color: color.name === 'Default' ? undefined : color } }
        }
        return node
      })
    )
  }

  const deleteNode = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id))
  }

  function extractText(node: any): string {
    if (!node) return ''
    if (node.type === 'text') return node.text
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join(node.type === 'paragraph' ? '\n' : ' ')
    }
    return ''
  }

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <div className="flex items-center gap-0.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-md px-1.5 py-0.5 shadow-subtle animate-in fade-in zoom-in duration-200">
          <button
            onClick={deleteNode}
            aria-label="Xóa note khỏi sơ đồ"
            className="w-7 h-7 rounded-sm flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150 active:scale-95"
            title="Remove Note from Canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'color' ? null : 'color')}
              aria-label="Đổi màu sắc note"
              className={`w-7 h-7 rounded-sm flex items-center justify-center transition-all duration-150 active:scale-95 ${
                activeMenu === 'color' 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Change Color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {activeMenu === 'color' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-md p-1.5 flex gap-1 z-50 shadow-floating animate-in fade-in zoom-in duration-150">
                {nodeColors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      updateNodeColor(c)
                      setActiveMenu(null)
                    }}
                    className="w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-800 hover:scale-110 transition-transform flex items-center justify-center"
                    style={{ backgroundColor: c.border }}
                    title={c.name}
                  >
                    {(data.color?.name === c.name || (!data.color && c.name === 'Default')) && (
                      <Check className="w-3 h-3 text-white mix-blend-difference" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </NodeToolbar>

      <div 
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (data.noteId) {
            router.replace(`/workspace?note=${data.noteId}`)
          }
        }}
        className={`group relative rounded-2xl border-2 transition-all w-80 max-h-96 flex flex-col shadow-none ${
          !data.color ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 hover:border-zinc-400 dark:hover:border-zinc-700' : ''
        }`}
        style={{
          borderColor: normalizedColor 
            ? (selected ? normalizedColor.border : normalizedColor.border)
            : (selected ? '#5e6ad2' : undefined),
          backgroundColor: normalizedColor?.bg
        }}
      >
        {/* Header */}
        <div 
          className={`flex items-center gap-2 p-3 border-b rounded-t-[14px] ${
            !data.color ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50' : ''
          }`}
          style={normalizedColor ? {
            borderColor: normalizedColor.border,
            backgroundColor: 'rgba(0, 0, 0, 0.03)'
          } : undefined}
        >
          <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{displayTitle}</h4>
        </div>
        
        {/* Content */}
        <div className="p-3 overflow-y-auto text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed max-h-60">
          {displayContent ? (
            typeof displayContent === 'string' ? (
              <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: displayContent }} />
            ) : (
              <div className="whitespace-pre-wrap">{extractText(displayContent)}</div>
            )
          ) : (
            <p className="text-zinc-400 dark:text-zinc-500 italic">Không có nội dung</p>
          )}
        </div>
        
        {/* Handles */}
        <Handle id="top" type="target" position={Position.Top} className={`border-2 border-white dark:border-zinc-900 transition-all z-50 hover:scale-125 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ backgroundColor: normalizedColor?.border || '#94A3B8', width: '10px', height: '10px' }} />
        <Handle id="bottom" type="source" position={Position.Bottom} className={`border-2 border-white dark:border-zinc-900 transition-all z-50 hover:scale-125 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ backgroundColor: normalizedColor?.border || '#94A3B8', width: '10px', height: '10px' }} />
        <Handle id="left" type="target" position={Position.Left} className={`border-2 border-white dark:border-zinc-900 transition-all z-50 hover:scale-125 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ backgroundColor: normalizedColor?.border || '#94A3B8', width: '10px', height: '10px' }} />
        <Handle id="right" type="source" position={Position.Right} className={`border-2 border-white dark:border-zinc-900 transition-all z-50 hover:scale-125 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ backgroundColor: normalizedColor?.border || '#94A3B8', width: '10px', height: '10px' }} />
      </div>
    </>
  )
}
