'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useClientNavigate } from '@/hooks/useClientNavigate'
import { useAppRouter } from '@/contexts/AppRouterContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  FilePlus,
  FolderPlus,
  LayoutGrid,
  GitFork,
  Link as LucideLink,
  Network,
  Library
} from 'lucide-react'
import { useLocalWorkspace } from '@/lib/local-first/useLocalWorkspace'
import { useLocalNotes } from '@/lib/local-first/useLocalNotes'
import { useLocalCanvas } from '@/lib/local-first/useLocalCanvas'
import { db } from '@/lib/local-first/db'
import { SIDEBAR_STYLES } from '@/lib/sidebar-styles'

import { getNodeIconData, buildTree, TreeNode, WorkspaceNode } from '@/lib/node-utils'
import LinkNodeModal from '@/components/workspace/LinkNodeModal'
import { DropdownCard, DropdownItem, DropdownSeparator } from '@/components/ui/DropdownCard'

export default function WorkspaceSection() {
  const pathname = usePathname()
  const { navigate } = useClientNavigate()
  const { route } = useAppRouter()

  const { nodes, updateNode, deleteNode, createNode, liveNodesReady } = useLocalWorkspace()
  const { updateNote: updateMindNote } = useLocalNotes()
  const { updateCanvas: updateMindmap } = useLocalCanvas()
  const { selectNote: ctxSelectNote, selectCanvas: ctxSelectCanvas, selectLink: ctxSelectLink, selectGraphView: ctxSelectGraphView, clearSelection } = useWorkspace()

  // Active state từ URL (route) thay vì WorkspaceContext.selection
  const activeNoteId = route.type === 'note' ? route.id : null
  const activeCanvasId = route.type === 'canvas' ? route.id : null
  const activeLinkId = route.type === 'link' ? route.id : null

  const loading = !liveNodesReady

  // State cho Bảng Tạo mới (Dropdown Menu)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const createMenuRef = useRef<HTMLDivElement>(null)

  // Lắng nghe click outside để đóng menu tạo mới
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCollapseAll = () => {
    setOpenNodes(new Set())
  }

  // State cho Link Node Modal
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkModalData, setLinkModalData] = useState<{
    mode: 'create' | 'edit'
    parentId?: string | null
    nodeId?: string
    title: string
    url: string
  } | null>(null)

  // State và Effect cho việc co/giãn toàn bộ phân mục Library
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-library-expanded')
      if (saved !== null) {
        setIsLibraryExpanded(saved === 'true')
      }
    }
  }, [])

  const handleToggleLibrary = (expanded: boolean) => {
    setIsLibraryExpanded(expanded)
    localStorage.setItem('sidebar-library-expanded', expanded.toString())
  }

  // State cho việc tạo Node mới
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null)

  // State cho việc xóa thư mục (Lựa chọn 1 hoặc 2)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<WorkspaceNode | null>(null)

  // States cho Kéo & Thả (Drag and Drop)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'inside' | 'after' | null>(null)

  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set())
  const [isOpenNodesLoaded, setIsOpenNodesLoaded] = useState(false)

  // Đọc openNodes từ localStorage khi mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('project-open-nodes')
      if (saved) {
        const arr = JSON.parse(saved)
        setOpenNodes(new Set(arr))
      }
      setIsOpenNodesLoaded(true)
    }
  }, [])

  // Lưu openNodes vào localStorage khi thay đổi
  useEffect(() => {
    if (isOpenNodesLoaded) {
      localStorage.setItem('project-open-nodes', JSON.stringify(Array.from(openNodes)))
    }
  }, [openNodes, isOpenNodesLoaded])

  // Tự động mở các thư mục cha của file đang active trên sidebar cây thư mục
  useEffect(() => {
    if (nodes.length > 0 && (activeNoteId || activeCanvasId || activeLinkId)) {
      const activeNode = nodes.find(n => n.note_id === activeNoteId || n.map_id === activeCanvasId || n.id === activeLinkId)
      if (activeNode && activeNode.parent_id) {
        setOpenNodes(prev => {
          const next = new Set(prev)
          let currParentId = activeNode.parent_id
          while (currParentId) {
            next.add(currParentId)
            const parentNode = nodes.find(n => n.id === currParentId)
            currParentId = parentNode?.parent_id || null
          }
          return next
        })
      }
    }
  }, [nodes, activeNoteId, activeCanvasId, activeLinkId])


  const projectTree = useMemo(() => {
    return buildTree(nodes)
  }, [nodes])

  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newType, setNewType] = useState<'folder' | 'note' | 'map' | 'link'>('folder')

  // State cho việc gắn Note có sẵn
  const [existingNotes, setExistingNotes] = useState<{ id: string, title: string }[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string>('')
  const [isLinkingExisting, setIsLinkingExisting] = useState(false)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ mouseX: number, mouseY: number, nodeId: string } | null>(null)

  useEffect(() => {
    const fetchExistingNotes = async () => {
      const data = await db.mind_notes.toArray()
      if (data) {
        setExistingNotes(data.map(n => ({ id: n.id, title: n.title })))
      }
    }
    fetchExistingNotes()
  }, [])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const toggleNode = (id: string) => {
    setOpenNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectNote = (noteId: string) => {
    ctxSelectNote(noteId)
    navigate(`/note/${noteId}`)
  }
  const handleSelectCanvas = (mapId: string) => {
    ctxSelectCanvas(mapId)
    navigate(`/canvas/${mapId}`)
  }
  const handleSelectLink = (linkId: string) => {
    ctxSelectLink(linkId)
    navigate(`/link/${linkId}`)
  }

  const handleLinkModalSubmit = async (title: string, url: string) => {
    if (!linkModalData) return

    if (linkModalData.mode === 'create') {
      const parentId = linkModalData.parentId ?? null
      const { data, error } = await createNode({
        title: title,
        type: 'link',
        url: url,
        parent_id: parentId,
        order: Math.max(...nodes.filter(n => n.parent_id === parentId).map(n => n.order || 0), -1) + 1
      })

      if (error) {
        alert(`Lỗi tạo link: ${error}`)
      } else if (data) {
        setCreatingParentId(null)
        handleSelectLink(data.id)
      }
    } else if (linkModalData.mode === 'edit' && linkModalData.nodeId) {
      const nodeId = linkModalData.nodeId
      try {
        await updateNode(nodeId, { title, url })
      } catch (err: any) {
        alert(`Lỗi khi sửa link: ${err.message}`)
      }
    }
  }

  const handleCreateNodeDirect = async (parentId: string | null, type: 'folder' | 'note' | 'map' | 'link') => {
    const defaultTitle = type === 'folder' ? 'Untitled Folder' : type === 'note' ? 'Untitled Note' : type === 'map' ? 'Untitled Canvas' : 'Untitled Link'

    if (type === 'link') {
      setLinkModalData({
        mode: 'create',
        parentId: parentId,
        title: '',
        url: ''
      })
      setLinkModalOpen(true)
      return
    }

    const { data, error } = await createNode({
      title: defaultTitle,
      type: type,
      url: null,
      parent_id: parentId,
      order: Math.max(...nodes.filter(n => n.parent_id === parentId).map(n => n.order || 0), -1) + 1
    })

    if (error) {
      alert(`Lỗi tạo node: ${error}`)
    } else if (data) {
      setCreatingParentId(null)
      setEditingNodeId(data.id)
      
      // Tự động mở folder cha
      if (parentId) {
        setOpenNodes(prev => {
          const next = new Set(prev)
          next.add(parentId)
          return next
        })
      }

      if (type === 'note' && data.note_id) {
        handleSelectNote(data.note_id)
      } else if (type === 'map' && data.map_id) {
        handleSelectCanvas(data.map_id)
      }
    }
  }

  const handleClearSelection = () => {
    clearSelection()
    navigate('/workspace')
  }

  const checkAndClearSelection = (deletedNodeId: string) => {
    let activeNode = undefined
    if (activeNoteId) {
      activeNode = nodes.find(n => n.type === 'note' && n.note_id === activeNoteId)
    } else if (activeCanvasId) {
      activeNode = nodes.find(n => n.type === 'map' && n.map_id === activeCanvasId)
    } else if (activeLinkId) {
      activeNode = nodes.find(n => n.type === 'link' && n.id === activeLinkId)
    }

    if (!activeNode) return

    let current: WorkspaceNode | undefined = activeNode
    let isTarget = false
    while (current) {
      if (current.id === deletedNodeId) {
        isTarget = true
        break
      }
      if (!current.parent_id) break
      const parentId = current.parent_id
      current = nodes.find(n => n.id === parentId)
    }

    if (isTarget) {
      handleClearSelection()
    }
  }

  const handleDeleteNode = async (id: string) => {
    const node = nodes.find(n => n.id === id)
    if (!node) return

    const hasChildren = nodes.some(n => n.parent_id === id)

    if (node.type === 'folder' && hasChildren) {
      setNodeToDelete(node)
      setDeleteModalOpen(true)
      return
    }

    if (confirm(`Bạn có chắc chắn muốn xóa ${node.type === 'folder' ? 'thư mục' : 'file'} này?`)) {
      checkAndClearSelection(id)
      const { error } = await deleteNode(id)
      if (error) {
        alert(`Lỗi xóa: ${error}`)
      }
    }
  }

  const handleNodeDrop = async (
    draggedId: string,
    targetId: string | null,
    position: 'before' | 'inside' | 'after'
  ) => {
    if (!draggedId) return

    if (targetId === null) {
      const draggedNode = nodes.find(n => n.id === draggedId)
      if (!draggedNode) return
      if (draggedNode.parent_id === null) return // Already at root, do nothing

      try {
        const rootNodes = nodes.filter(n => n.parent_id === null && n.id !== draggedId)
        const newOrder = Math.max(...rootNodes.map(n => n.order || 0), -1) + 1
        await updateNode(draggedId, { parent_id: null, order: newOrder })
      } catch (err: any) {
        alert(`Lỗi khi di chuyển file: ${err.message}`)
      }
      return
    }

    if (draggedId === targetId) return

    const draggedNode = nodes.find(n => n.id === draggedId)
    const targetNode = nodes.find(n => n.id === targetId)
    if (!draggedNode || !targetNode) return

    let newParentId: string | null = null
    let newOrder = 0

    if (position === 'inside') {
      if (targetNode.type !== 'folder') return
      if (draggedNode.parent_id === targetNode.id) return // Already inside target folder, do nothing
      newParentId = targetNode.id
      const children = nodes.filter(n => n.parent_id === targetNode.id && n.id !== draggedId)
      newOrder = Math.max(...children.map(n => n.order || 0), -1) + 1
    } else {
      newParentId = targetNode.parent_id ?? null
      const siblings = nodes
        .filter(n => n.parent_id === newParentId && n.id !== draggedId)
        .sort((a, b) => (a.order || 0) - (b.order || 0))

      const targetIndex = siblings.findIndex(s => s.id === targetNode.id)
      if (targetIndex === -1) return

      let insertIndex = targetIndex
      if (position === 'after') {
        insertIndex = targetIndex + 1
      }

      // Kiểm tra nếu không thay đổi parent và vị trí thả vẫn giữa đúng 2 sibling cũ → bỏ qua, không ghi DB
      if (newParentId === draggedNode.parent_id) {
        const allSiblings = nodes
          .filter(n => n.parent_id === newParentId)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
        const draggedIndex = allSiblings.findIndex(s => s.id === draggedId)
        const currentPrevId = allSiblings[draggedIndex - 1]?.id ?? null
        const currentNextId = allSiblings[draggedIndex + 1]?.id ?? null
        const newPrevId = siblings[insertIndex - 1]?.id ?? null
        const newNextId = siblings[insertIndex]?.id ?? null
        if (currentPrevId === newPrevId && currentNextId === newNextId) return
      }

      // Fractional ordering: chỉ cần 1 write duy nhất cho dragged node
      // Tính order = midpoint giữa 2 sibling xung quanh điểm thả
      const prevOrder = siblings[insertIndex - 1]?.order ?? -1
      const nextOrder = siblings[insertIndex]?.order ?? (prevOrder + 2)
      newOrder = (prevOrder + nextOrder) / 2
    }

    try {
      await updateNode(draggedId, { parent_id: newParentId, order: newOrder })
      if (position === 'inside' && !openNodes.has(targetId)) {
        toggleNode(targetId)
      }
    } catch (err: any) {
      alert(`Lỗi khi di chuyển file: ${err.message}`)
    }
  }

  // Cung cấp context nội bộ
  const sidebarContextValue = {
    openNodes,
    activeNoteId,
    activeCanvasId,
    activeLinkId,
    editingNodeId,
    creatingParentId,
    setEditingNodeId,
    setCreatingParentId,
    setNewType,
    setIsLinkingExisting,
    updateNode,
    updateMindNote,
    updateMindmap,
    handleDeleteNode,
    handleCreateNodeDirect,
    setContextMenu,
    toggleNode,
    onSelectNote: handleSelectNote,
    onSelectCanvas: handleSelectCanvas,
    onSelectLink: handleSelectLink,
    draggedNodeId,
    dragOverNodeId,
    dropPosition,
    setDraggedNodeId,
    setDragOverNodeId,
    setDropPosition,
    handleNodeDrop,
    nodes
  }

  return (
    <>
      <div className="flex-1 flex flex-col pt-0 px-0 relative group/sidebar min-h-0">
        {/* Tiêu đề mục Library tích hợp Hover và Nút điều khiển nhanh */}
        <div 
          onClick={() => {
            ctxSelectGraphView()
            navigate('/graph')
          }}
          className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md select-none shrink-0 relative group/lib-header cursor-pointer transition-colors ${createMenuOpen ? 'bg-hover-bg' : 'hover:bg-hover-bg'}`}
        >
          <div className="flex items-center gap-2">
            <Library className="w-3.5 h-3.5 text-zinc-400/80" strokeWidth={2} />
            <span className="font-semibold text-[12px] text-secondary">Library</span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Nhóm nút nâng cao chỉ xuất hiện khi Hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover/lib-header:opacity-100 transition-opacity">
              {/* Nút tạo mới */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCreateMenuOpen(!createMenuOpen)
                }}
                className="p-1 rounded hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50 text-zinc-400 hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                title="Tạo tài liệu mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Nút co/giãn mục Library luôn xuất hiện ở góc ngoài cùng bên phải */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleLibrary(!isLibraryExpanded)
              }}
              className="p-0.5 rounded hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50 text-zinc-400 hover:text-foreground transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title={isLibraryExpanded ? "Thu gọn Library" : "Mở rộng Library"}
            >
              <ChevronDown className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isLibraryExpanded ? '' : '-rotate-90'}`} />
            </button>
          </div>

          {/* Bảng Tạo mới (Dropdown Menu) */}
          {createMenuOpen && (
            <DropdownCard 
              dropdownRef={createMenuRef}
              className="absolute right-1 top-9 w-40"
            >
              <DropdownItem
                onClick={() => {
                  setCreateMenuOpen(false)
                  handleCreateNodeDirect(null, 'note')
                }}
                icon={FilePlus}
              >
                Tạo Note mới
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  setCreateMenuOpen(false)
                  handleCreateNodeDirect(null, 'map')
                }}
                icon={LayoutGrid}
              >
                Tạo Canvas mới
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  setCreateMenuOpen(false)
                  handleCreateNodeDirect(null, 'link')
                }}
                icon={LucideLink}
              >
                Tạo Liên kết mới
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  setCreateMenuOpen(false)
                  handleCreateNodeDirect(null, 'folder')
                }}
                icon={FolderPlus}
              >
                Tạo Thư mục mới
              </DropdownItem>
            </DropdownCard>
          )}
        </div>

        <div 
          onDragOver={(e) => {
            if (draggedNodeId) {
              e.preventDefault()
            }
          }}
          onDrop={async (e) => {
            if (draggedNodeId) {
              e.preventDefault()
              const currentDraggedId = draggedNodeId
              setDraggedNodeId(null)
              handleNodeDrop(currentDraggedId, null, 'inside')
            }
          }}
          className="flex-1 overflow-y-auto no-scrollbar pt-3 flex flex-col gap-0.5"
        >
          {!isLibraryExpanded ? null : loading ? (
            <div className="space-y-2 animate-pulse mt-2">
              <div className="flex items-center gap-2 p-1.5">
                <div className="w-3.5 h-3.5 bg-active-bg/50 rounded"></div>
                <div className="w-3/4 h-3 bg-active-bg/50 rounded"></div>
              </div>
              <div className="flex items-center gap-2 p-1.5">
                <div className="w-3.5 h-3.5 bg-active-bg/50 rounded"></div>
                <div className="w-1/2 h-3 bg-active-bg/50 rounded"></div>
              </div>
              <div className="flex items-center gap-2 p-1.5">
                <div className="w-3.5 h-3.5 bg-active-bg/50 rounded"></div>
                <div className="w-2/3 h-3 bg-active-bg/50 rounded"></div>
              </div>
            </div>
          ) : projectTree.length === 0 ? (
            <div className="text-center text-xs text-secondary/50 mt-4">Chưa có file nào trong dự án</div>
          ) : (
            <SidebarContext.Provider value={sidebarContextValue as any}>
              {projectTree.map(node => (
                <RenderNode key={node.id} node={node} level={0} />
              ))}
            </SidebarContext.Provider>
          )}
        </div>
      </div>

      {contextMenu && (() => {
        const node = nodes.find(n => n.id === contextMenu.nodeId)
        const hasChildren = nodes.some(n => n.parent_id === contextMenu.nodeId)
        const isFolderWithChildren = node?.type === 'folder' && hasChildren

        return (
          <DropdownCard
            className="fixed w-48 !z-[1000]"
            style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
          >
            <DropdownItem
              onClick={() => {
                setEditingNodeId(contextMenu.nodeId)
                setContextMenu(null)
              }}
              icon={Plus}
            >
              Đổi tên
            </DropdownItem>

            {node?.type === 'link' && (
              <>
                <DropdownSeparator />
                <DropdownItem
                  onClick={() => {
                    setLinkModalData({
                      mode: 'edit',
                      nodeId: node.id,
                      title: node.title,
                      url: node.url || ''
                    })
                    setLinkModalOpen(true)
                    setContextMenu(null)
                  }}
                  icon={LucideLink}
                >
                  Sửa tiêu đề & URL
                </DropdownItem>
              </>
            )}

            {isFolderWithChildren ? (
              <>
                <DropdownSeparator />
                <div className="px-3 py-1 text-[10px] text-secondary font-medium">Lựa chọn xóa:</div>
                <DropdownItem
                  onClick={async () => {
                    const children = nodes.filter(n => n.parent_id === node.id)
                    setContextMenu(null)

                    for (const child of children) {
                      await updateNode(child.id, { parent_id: null })
                    }
                    // For "Chỉ xóa thư mục", we only clear if the folder ITSELF is the active node. 
                    // But active nodes are only notes, maps, or links, not folders.
                    // However, we can still call checkAndClearSelection just to be safe, 
                    // though it will do nothing because the active node's parent_id is set to null above, 
                    // so it's no longer a descendant of `node.id`.
                    // Actually, let's call it BEFORE we change parent_id to be safe? 
                    // No, if we keep the children, the active child is NOT deleted, so we should NOT clear selection.
                    await deleteNode(node.id)
                  }}
                  icon={Trash2}
                >
                  Chỉ xóa thư mục
                </DropdownItem>

                <DropdownItem
                  variant="danger"
                  onClick={async () => {
                    setContextMenu(null)
                    checkAndClearSelection(node.id)
                    await deleteNode(node.id)
                  }}
                  icon={Trash2}
                >
                  Xóa toàn bộ
                </DropdownItem>
              </>
            ) : (
              <DropdownItem
                variant="danger"
                onClick={() => {
                  handleDeleteNode(contextMenu.nodeId)
                  setContextMenu(null)
                }}
                icon={Trash2}
              >
                Xóa
              </DropdownItem>
            )}
          </DropdownCard>
        )
      })()}

      <LinkNodeModal
        isOpen={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false)
          setLinkModalData(null)
        }}
        onSubmit={handleLinkModalSubmit}
        initialTitle={linkModalData?.title || ''}
        initialUrl={linkModalData?.url || ''}
        mode={linkModalData?.mode || 'create'}
      />

      {deleteModalOpen && nodeToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg shadow-overlay border border-border-main p-6 w-[400px]">
            <h3 className="text-lg font-medium mb-2 text-foreground">Xóa thư mục</h3>
            <p className="text-sm text-secondary mb-6 leading-relaxed">
              Thư mục <strong>{nodeToDelete.title}</strong> đang chứa các file/thư mục con. Bạn có chắc chắn muốn xóa thư mục này và toàn bộ nội dung bên trong không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setNodeToDelete(null)
                }}
                className="px-4 py-2 text-sm font-medium text-secondary bg-active-bg hover:bg-hover-bg rounded border border-border-main transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  checkAndClearSelection(nodeToDelete.id)
                  const { error } = await deleteNode(nodeToDelete.id)
                  if (error) {
                    alert(`Lỗi xóa: ${error}`)
                  }
                  setDeleteModalOpen(false)
                  setNodeToDelete(null)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const SidebarContext = React.createContext<any>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider')
  return context
}

const NodeTitleText = React.memo(({ node, isActive }: { node: TreeNode; isActive: boolean }) => {
  const { activeId, title: activeContextTitle } = useWorkspace()
  const displayTitle = (isActive && activeId === node.note_id && activeContextTitle) ? activeContextTitle : node.title
  return <span className="truncate flex-1">{displayTitle}</span>
})
NodeTitleText.displayName = 'NodeTitleText'

const RenderNode = React.memo(({ node, level }: { node: TreeNode; level: number }) => {
  const {
    openNodes,
    activeNoteId,
    activeCanvasId,
    activeLinkId,
    editingNodeId,
    creatingParentId,
    setEditingNodeId,
    setCreatingParentId,
    setNewType,
    setIsLinkingExisting,
    updateNode,
    updateMindNote,
    updateMindmap,
    handleDeleteNode,
    handleCreateNodeDirect,
    setContextMenu,
    toggleNode,
    onSelectNote,
    onSelectCanvas,
    onSelectLink,
    draggedNodeId,
    dragOverNodeId,
    dropPosition,
    setDraggedNodeId,
    setDragOverNodeId,
    setDropPosition,
    handleNodeDrop,
    nodes
  } = useSidebar()

  const { icon: Icon, color } = getNodeIconData(node.type, node.url)
  const isOpen = openNodes.has(node.id)
  const isActive = (node.type === 'note' && node.note_id === activeNoteId) ||
                   (node.type === 'map' && node.map_id === activeCanvasId) ||
                   (node.type === 'link' && node.id === activeLinkId)

  const isActiveNote = node.type === 'note' && node.note_id === activeNoteId
  const isDragOver = dragOverNodeId === node.id && draggedNodeId !== node.id

  const isDraggingRef = React.useRef(false)
  // Cache danh sách node con của dragged node để check O(1) trong onDragOver
  const invalidTargetIdsRef = React.useRef<Set<string>>(new Set())

  return (
    <div className="flex flex-col gap-0.5">
      <div
        draggable={editingNodeId !== node.id}
        onMouseDown={() => {
          isDraggingRef.current = false
        }}
        onDragStart={(e) => {
          e.stopPropagation()
          isDraggingRef.current = true
          setDraggedNodeId(node.id)
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', node.id)
          // Tính tất cả node con 1 lần khi bắt đầu kéo
          const getDescendantIds = (id: string): string[] => {
            const children = nodes.filter((n: any) => n.parent_id === id)
            return [id, ...children.flatMap((c: any) => getDescendantIds(c.id))]
          }
          invalidTargetIdsRef.current = new Set(getDescendantIds(node.id))
        }}
        onDragEnd={() => {
          isDraggingRef.current = false
          setDraggedNodeId(null)
          setDragOverNodeId(null)
          setDropPosition(null)
        }}
        onDragOver={(e) => {
          // O(1) check bằng ref đã cache từ onDragStart
          if (!draggedNodeId || invalidTargetIdsRef.current.has(node.id)) return

          e.preventDefault()
          e.stopPropagation()

          const rect = e.currentTarget.getBoundingClientRect()
          const relativeY = e.clientY - rect.top

          let position: 'before' | 'inside' | 'after' = 'inside'

          if (node.type === 'folder') {
            if (relativeY < rect.height * 0.25) {
              position = 'before'
            } else if (relativeY > rect.height * 0.75) {
              position = 'after'
            } else {
              position = 'inside'
            }
          } else {
            if (relativeY < rect.height * 0.5) {
              position = 'before'
            } else {
              position = 'after'
            }
          }

          setDragOverNodeId(node.id)
          setDropPosition(position)
        }}
        onDragLeave={(e) => {
          // Chỉ reset khi chuột thực sự rời khỏi node item (không phải rời child element)
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          setDragOverNodeId(null)
          setDropPosition(null)
        }}
        onDrop={async (e) => {
          if (!draggedNodeId) return

          e.preventDefault()
          e.stopPropagation()

          if (draggedNodeId === node.id) return

          const position = dropPosition
          const currentDraggedId = draggedNodeId

          setDragOverNodeId(null)
          setDropPosition(null)
          setDraggedNodeId(null)

          if (!position) return

          handleNodeDrop(currentDraggedId, node.id, position)
        }}
        className={`relative flex items-center gap-2 p-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-all group select-none
          ${isActive 
            ? 'bg-primary/5 text-primary font-bold' 
            : 'text-secondary hover:text-foreground hover:bg-hover-bg'}
          ${isDragOver && dropPosition === 'inside' ? 'bg-blue-50/70 border border-blue-500' : ''}
          text-standard
        `}
        onClick={() => {
          if (isDraggingRef.current) return
          if (node.type === 'folder') {
            toggleNode(node.id)
          } else if (node.type === 'note' && node.note_id) {
            onSelectNote(node.note_id)
          } else if (node.type === 'map' && node.map_id) {
            onSelectCanvas(node.map_id)
          } else if (node.type === 'link') {
            onSelectLink(node.id)
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setContextMenu({
            mouseX: e.clientX,
            mouseY: e.clientY,
            nodeId: node.id
          })
        }}
      >
        {dragOverNodeId === node.id && dropPosition === 'before' && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-zinc-300 dark:bg-zinc-600 pointer-events-none" />
        )}
        {dragOverNodeId === node.id && dropPosition === 'after' && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-zinc-300 dark:bg-zinc-600 pointer-events-none" />
        )}
        {node.type === 'folder' ? (
          <ChevronRight className={`w-3 h-3 transition-transform text-secondary/30 ${isOpen ? 'rotate-90' : ''}`} />
        ) : (
          <div className="w-3" />
        )}
        <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.5} />
        {editingNodeId === node.id ? (
          <input
            type="text"
            defaultValue={node.title}
            className="flex-1 bg-surface border border-blue-500 rounded px-1 text-xs outline-none text-foreground"
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.nativeEvent.isComposing) return
                e.preventDefault()
                e.currentTarget.blur()
              } else if (e.key === 'Escape') {
                setEditingNodeId(null)
              }
            }}
            onBlur={async (e) => {
              const title = e.currentTarget.value.trim()
              if (!title || title === node.title) {
                setEditingNodeId(null)
                return
              }
              e.currentTarget.disabled = true
              try {
                await updateNode(node.id, { title })
                if (node.type === 'note' && node.note_id) {
                  await updateMindNote(node.note_id, { title })
                } else if (node.type === 'map' && node.map_id) {
                  await updateMindmap(node.map_id, { title })
                }
              } catch (err: any) {
                alert(`Lỗi khi đổi tên: ${err.message}`)
              } finally {
                setEditingNodeId(null)
              }
            }}
          />
        ) : (
          <NodeTitleText node={node} isActive={isActiveNote} />
        )}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          {node.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCreatingParentId(node.id)
                setNewType('folder')
                setIsLinkingExisting(false)
                if (!isOpen) {
                  toggleNode(node.id)
                }
              }}
              className="p-1 hover:bg-hover-bg rounded"
              title="Thêm node con"
            >
              <Plus className="w-3 h-3 text-secondary" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteNode(node.id)
            }}
            className="p-1 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded"
            title="Xóa"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>
      {((isOpen && node.children.length > 0) || creatingParentId === node.id) && (
        <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-[11px] pl-[10px] flex flex-col gap-0.5 mt-0.5">
          {creatingParentId === node.id && (
            <div className="mb-2 px-1 flex items-center justify-start gap-1 border-b border-border-main/50 pb-2 text-[10px]">
              <button onClick={() => handleCreateNodeDirect(node.id, 'note')} className="p-1 hover:bg-hover-bg rounded text-secondary hover:text-foreground transition-colors">Note</button>
              <button onClick={() => handleCreateNodeDirect(node.id, 'map')} className="p-1 hover:bg-hover-bg rounded text-secondary hover:text-foreground transition-colors">Canvas</button>
              <button onClick={() => handleCreateNodeDirect(node.id, 'link')} className="p-1 hover:bg-hover-bg rounded text-secondary hover:text-foreground transition-colors">Link</button>
              <button onClick={() => handleCreateNodeDirect(node.id, 'folder')} className="p-1 hover:bg-hover-bg rounded text-secondary hover:text-foreground transition-colors">Folder</button>
              <button onClick={() => setCreatingParentId(null)} className="p-1 bg-active-bg hover:bg-hover-bg rounded ml-auto text-secondary">Hủy</button>
            </div>
          )}
          {isOpen && node.children.map(child => (
            <RenderNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
})
RenderNode.displayName = 'RenderNode'
