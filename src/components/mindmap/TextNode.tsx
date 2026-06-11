import { useCallback, useEffect, useRef, useState } from 'react'
import { Handle, Position, useReactFlow, NodeResizer, NodeToolbar } from '@xyflow/react'
import { Check, Trash2, Palette, Edit2, Network } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TextNode({ id, data, selected }: { id: string; data: any; selected: boolean }) {
  const router = useRouter()
  const { setNodes } = useReactFlow()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeMenu, setActiveMenu] = useState<'color' | null>(null)

  const onChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, label: evt.target.value } }
        }
        return node
      })
    )
  }, [id, setNodes])

  // Auto-resize on initial load and when data changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [data.label])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Move cursor to end
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }, [isEditing])

  useEffect(() => {
    if (!selected) setIsEditing(false)
  }, [selected])

  // Tắt draggable của node khi đang edit để không bị kéo khi bôi đen text
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, draggable: !isEditing }
        }
        return node
      })
    )
  }, [isEditing, id, setNodes])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.isLink && data.targetId) {
      router.replace(`/workspace?canvas=${data.targetId}`)
    } else {
      setIsEditing(true)
    }
  }

  const onBlur = useCallback(() => {
    setIsEditing(false)
  }, [])

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

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <div className="flex items-center gap-0.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-md px-1.5 py-0.5 shadow-subtle animate-in fade-in zoom-in duration-200">
          <button
            onClick={deleteNode}
            aria-label="Xóa thẻ"
            className="w-7 h-7 rounded-sm flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150 active:scale-95"
            title="Delete Card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'color' ? null : 'color')}
              aria-label="Đổi màu sắc thẻ"
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

          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

          <button
            onClick={() => setIsEditing(true)}
            aria-label="Chỉnh sửa văn bản"
            className="w-7 h-7 rounded-sm flex items-center justify-center transition-all duration-150 active:scale-95 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Edit Text"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </NodeToolbar>

      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={48}
        handleClassName="custom-resize-handle"
        lineClassName="custom-resize-line"
        lineStyle={{ borderColor: 'transparent' }}
      />

      <div
        onDoubleClick={handleDoubleClick}
        className={`group relative w-full h-full min-w-[100px] min-h-[48px] flex items-center justify-center rounded-2xl transition-all py-2 px-4 ${selected ? 'border-2 shadow-none' : 'border hover:border-border-strong'}`}
        style={{
          borderColor: selected ? (data.color?.border || '#0f172a') : (data.color?.border || '#cbd5e1'),
          backgroundColor: data.color?.bg || '#ffffff'
        }}
      >
        {/* Handles - Use only source handles with Loose mode to allow dragging from any side */}
        <Handle id="top" type="source" position={Position.Top} className={`border-2 border-white transition-all z-50 hover:scale-125 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ backgroundColor: data.color?.border || '#94A3B8', width: '10px', height: '10px' }} />
        <Handle id="bottom" type="source" position={Position.Bottom} className={`border-2 border-white transition-all z-50 hover:scale-125 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ backgroundColor: data.color?.border || '#94A3B8', width: '10px', height: '10px' }} />
        <Handle id="left" type="source" position={Position.Left} className={`border-2 border-white transition-all z-50 hover:scale-125 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ backgroundColor: data.color?.border || '#94A3B8', width: '10px', height: '10px' }} />
        <Handle id="right" type="source" position={Position.Right} className={`border-2 border-white transition-all z-50 hover:scale-125 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ backgroundColor: data.color?.border || '#94A3B8', width: '10px', height: '10px' }} />

        <div className="flex items-center gap-2 w-full">
          {data.isLink && <Network className="w-4 h-4 text-primary shrink-0" />}
          <textarea
            ref={textareaRef}
            readOnly={!isEditing || data.isLink}
            aria-label="Nội dung thẻ"
            className={`w-full resize-none outline-none bg-transparent text-gray-800 text-sm leading-relaxed overflow-hidden ${
              isEditing && !data.isLink
                ? 'cursor-text'
                : 'cursor-default select-none pointer-events-none'
            }`}
            value={data.label}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={isEditing ? "Type something..." : ""}
            rows={1}
          />
        </div>
      </div>
    </>
  )
}
