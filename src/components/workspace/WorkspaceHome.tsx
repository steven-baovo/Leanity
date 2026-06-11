'use client'

import React, { useMemo, useState, useContext } from 'react'
import { useClientNavigate } from '@/hooks/useClientNavigate'
import { TasksContext } from '@/lib/local-first/TasksProvider'
import { LocalIssue } from '@/lib/local-first/db'
import { buildTree, TreeNode, WorkspaceNode, getNodeIconData } from '@/lib/node-utils'
import {
  AlertCircle,
  ChevronsUp,
  ChevronUp,
  GitFork,
  Share2,
  ChevronRight,
  ChevronDown,
  Clock,
  Folder,
  FileText,
  Network,
  Globe,
  CheckCircle2,
  ArrowRight,
  Zap,
  FolderOpen,
  Calendar,
} from 'lucide-react'

// ─── Eisenhower Matrix Logic ──────────────────────────────────────────────────

type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4'

function getDaysUntilDue(dueDateStr: string | null | undefined): number | null {
  if (!dueDateStr) return null
  const due = new Date(dueDateStr)
  const now = new Date()
  due.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function isUrgent(issue: LocalIssue): boolean {
  if (issue.priority === 'urgent') return true
  const days = getDaysUntilDue(issue.due_date)
  if (days !== null && days <= 3) return true
  return false
}

function isImportant(issue: LocalIssue): boolean {
  return issue.priority === 'urgent' || issue.priority === 'high'
}

function classifyTask(issue: LocalIssue): Quadrant {
  const u = isUrgent(issue)
  const i = isImportant(issue)
  if (u && i) return 'Q1'
  if (!u && i) return 'Q2'
  if (u && !i) return 'Q3'
  return 'Q4'
}

const QUADRANT_ORDER: Record<Quadrant, number> = { Q1: 0, Q2: 1, Q3: 2, Q4: 3 }
const PRIORITY_SCORE: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 }

function getUrgencyScore(issue: LocalIssue): number {
  let score = PRIORITY_SCORE[issue.priority] * 1000
  const days = getDaysUntilDue(issue.due_date)
  if (days !== null) {
    // Gần hạn hơn → điểm cao hơn
    score += Math.max(0, 365 - days)
  }
  if (issue.status === 'in_progress') score += 50
  else if (issue.status === 'todo') score += 30
  return score
}

// ─── Task Card ────────────────────────────────────────────────────────────────

const QUADRANT_META: Record<Quadrant, { label: string; color: string; bg: string; border: string; dot: string }> = {
  Q1: {
    label: 'Làm ngay',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-500/5',
    border: 'border-red-200 dark:border-red-500/20',
    dot: 'bg-red-500',
  },
  Q2: {
    label: 'Lên kế hoạch',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-500/5',
    border: 'border-indigo-200 dark:border-indigo-500/20',
    dot: 'bg-indigo-500',
  },
  Q3: {
    label: 'Cần chú ý',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/5',
    border: 'border-amber-200 dark:border-amber-500/20',
    dot: 'bg-amber-500',
  },
  Q4: {
    label: 'Ít quan trọng',
    color: 'text-zinc-400',
    bg: 'bg-zinc-50 dark:bg-zinc-800/30',
    border: 'border-zinc-200 dark:border-zinc-700/50',
    dot: 'bg-zinc-400',
  },
}

function getPriorityIcon(priority: string) {
  const cls = 'w-3 h-3 shrink-0'
  switch (priority) {
    case 'urgent': return <AlertCircle className={`${cls} text-red-500`} />
    case 'high': return <ChevronsUp className={`${cls} text-orange-500`} />
    case 'medium': return <ChevronUp className={`${cls} text-blue-500`} />
    case 'low': return <ChevronDown className={`${cls} text-zinc-400`} />
    default: return null
  }
}

function DueDateBadge({ dueDateStr }: { dueDateStr: string | null | undefined }) {
  const days = getDaysUntilDue(dueDateStr)
  if (days === null) return null

  let label = ''
  let cls = ''

  if (days < 0) {
    label = `Quá hạn ${Math.abs(days)} ngày`
    cls = 'text-red-500 bg-red-50 dark:bg-red-500/10'
  } else if (days === 0) {
    label = 'Hôm nay'
    cls = 'text-red-500 bg-red-50 dark:bg-red-500/10'
  } else if (days === 1) {
    label = 'Ngày mai'
    cls = 'text-orange-500 bg-orange-50 dark:bg-orange-500/10'
  } else if (days <= 3) {
    label = `Còn ${days} ngày`
    cls = 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'
  } else {
    const d = new Date(dueDateStr!)
    label = `${d.getDate()}/${d.getMonth() + 1}`
    cls = 'text-secondary bg-active-bg'
  }

  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      <Clock className="w-2.5 h-2.5 shrink-0" />
      {label}
    </span>
  )
}

function TaskRow({ issue }: { issue: LocalIssue }) {
  const { navigate } = useClientNavigate()

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 border-red-500/20 text-red-500'
      case 'high': return 'bg-orange-500/10 border-orange-500/20 text-orange-500'
      case 'medium': return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
      case 'low': return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
      default: return 'bg-zinc-500/5 border-transparent text-zinc-400'
    }
  }

  return (
    <div
      onClick={() => navigate('/tasks')}
      className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-main/40 bg-zinc-50/30 dark:bg-zinc-900/10 hover:bg-hover-bg hover:border-border-strong/20 transition-all duration-150 cursor-pointer min-w-0"
    >
      {/* Priority Indicator Badge */}
      <span className={`flex items-center justify-center p-1 rounded-md border shrink-0 ${getPriorityStyle(issue.priority)}`}>
        {getPriorityIcon(issue.priority) || <div className="w-3 h-3 rounded-full bg-zinc-400/50" />}
      </span>

      {/* Task Title */}
      <span className="flex-1 text-[11px] font-medium text-foreground truncate select-none">
        {issue.title}
      </span>

      {/* Due date Badge */}
      {issue.due_date && <DueDateBadge dueDateStr={issue.due_date} />}

      {/* Hover Arrow */}
      <ArrowRight className="w-3 h-3 text-secondary/40 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity ml-1" />
    </div>
  )
}

// ─── Priority Panel ───────────────────────────────────────────────────────────

function PriorityPanel() {
  const { issues } = useContext(TasksContext)
  const { navigate } = useClientNavigate()

  const sortedTasks = useMemo(() => {
    if (!issues) return []
    return issues
      .filter(i => i.status !== 'done' && i.status !== 'canceled' && i.is_deleted === 0)
      .map(i => ({ issue: i, quadrant: classifyTask(i), score: getUrgencyScore(i) }))
      .sort((a, b) => {
        const qDiff = QUADRANT_ORDER[a.quadrant] - QUADRANT_ORDER[b.quadrant]
        if (qDiff !== 0) return qDiff
        return b.score - a.score
      })
  }, [issues])

  if (!issues) {
    return (
      <div className="flex items-center gap-2 text-xs text-secondary/50 py-2">
        <div className="w-3 h-3 rounded-full bg-primary/20 animate-pulse" />
        Đang tải tasks...
      </div>
    )
  }

  if (sortedTasks.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Không có task nào cần chú ý</p>
          <p className="text-[11px] text-secondary/60 mt-0.5">Mọi task đang trong tình trạng tốt 🎉</p>
        </div>
      </div>
    )
  }

  const VISIBLE_COUNT = 6

  return (
    <div className="flex flex-col gap-1.5">
      {sortedTasks.slice(0, VISIBLE_COUNT).map(({ issue }) => (
        <TaskRow key={issue.id} issue={issue} />
      ))}
      {sortedTasks.length > VISIBLE_COUNT && (
        <button
          onClick={() => navigate('/tasks')}
          className="text-[11px] text-secondary hover:text-primary font-medium py-1.5 text-center transition-colors cursor-pointer"
        >
          Xem thêm {sortedTasks.length - VISIBLE_COUNT} task khác →
        </button>
      )}
    </div>
  )
}

// ─── File Grid (Google Drive style) ───────────────────────────────────────────

function FileTypeIcon({ type, url, size = 'md' }: { type: string; url?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const { icon: Icon, color } = getNodeIconData(type, url)
  const sizeMap = { sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-9 h-9' }

  if (type === 'folder') {
    return <Folder className={`${sizeMap[size]} text-primary/70`} strokeWidth={1.5} />
  }

  return <Icon className={`${sizeMap[size]} ${color}`} strokeWidth={1.5} />
}

function FileCard({
  node,
  onOpen,
  openFolderId,
  setOpenFolderId,
}: {
  node: TreeNode
  onOpen: (node: TreeNode) => void
  openFolderId: string | null
  setOpenFolderId: (id: string | null) => void
}) {
  const isFolder = node.type === 'folder'
  const isOpen = openFolderId === node.id

  return (
    <div className="flex flex-col">
      <div
        onDoubleClick={() => onOpen(node)}
        onClick={() => {
          if (isFolder) setOpenFolderId(isOpen ? null : node.id)
        }}
        className={`
          group relative flex flex-col items-center justify-center gap-2.5
          p-3 pt-4 rounded-xl border border-border-main
          bg-surface hover:bg-hover-bg hover:border-border-strong/40
          cursor-pointer transition-all duration-150 select-none
          ${isOpen ? 'ring-2 ring-primary/20 border-primary/30 bg-primary/3' : ''}
        `}
        title={isFolder ? 'Nhấn để xem nội dung, nhấn đúp để mở' : 'Nhấn đúp để mở'}
      >
        {/* Icon */}
        <div className="relative">
          <FileTypeIcon type={node.type} url={node.url} size="lg" />
          {isFolder && node.children.length > 0 && (
            <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-primary/10 text-primary rounded px-1">
              {node.children.length}
            </span>
          )}
        </div>

        {/* Name */}
        <span className="w-full text-center text-[11px] font-medium text-foreground leading-tight line-clamp-2 break-words">
          {node.title}
        </span>
      </div>

      {/* Folder expand: show children inline below */}
      {isFolder && isOpen && node.children.length > 0 && (
        <div className="mt-1 ml-2 pl-2 border-l-2 border-primary/20 flex flex-col gap-0.5">
          {node.children.map(child => (
            <div
              key={child.id}
              onDoubleClick={() => onOpen(child)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-hover-bg cursor-pointer transition-colors group"
            >
              <FileTypeIcon type={child.type} url={child.url} size="sm" />
              <span className="text-[11px] text-foreground truncate flex-1">{child.title}</span>
              <ArrowRight className="w-3 h-3 text-secondary/30 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LibraryGrid({
  nodes,
  onSelectNote,
  onSelectCanvas,
  onSelectLink,
}: {
  nodes: WorkspaceNode[]
  onSelectNote: (id: string) => void
  onSelectCanvas: (id: string) => void
  onSelectLink: (id: string) => void
}) {
  const tree = useMemo(() => buildTree(nodes), [nodes])
  const [openFolderId, setOpenFolderId] = useState<string | null>(null)

  const handleOpen = (node: TreeNode) => {
    if (node.type === 'note' && node.note_id) onSelectNote(node.note_id)
    else if (node.type === 'map' && node.map_id) onSelectCanvas(node.map_id)
    else if (node.type === 'link') onSelectLink(node.id)
  }

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <FolderOpen className="w-10 h-10 text-secondary/20" strokeWidth={1.5} />
        <div>
          <p className="text-xs font-semibold text-secondary/60">Library trống</p>
          <p className="text-[11px] text-secondary/40 mt-0.5">Tạo note, canvas hoặc thư mục từ thanh bên trái</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
      {tree.map(node => (
        <FileCard
          key={node.id}
          node={node}
          onOpen={handleOpen}
          openFolderId={openFolderId}
          setOpenFolderId={setOpenFolderId}
        />
      ))}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface WorkspaceHomeProps {
  nodes: WorkspaceNode[]
  onSelectNote: (id: string) => void
  onSelectCanvas: (id: string) => void
  onSelectLink: (id: string) => void
}

export default function WorkspaceHome({ nodes, onSelectNote, onSelectCanvas, onSelectLink }: WorkspaceHomeProps) {
  const { issues } = useContext(TasksContext)
  const { navigate } = useClientNavigate()

  const todayTasks = useMemo(() => {
    if (!issues) return []
    const now = new Date()
    return issues.filter(i => {
      if (i.status === 'done' || i.status === 'canceled' || i.is_deleted === 1) return false
      if (!i.due_date) return false
      
      const due = new Date(i.due_date)
      return due.getFullYear() === now.getFullYear() &&
             due.getMonth() === now.getMonth() &&
             due.getDate() === now.getDate()
    })
  }, [issues])

  const priorityTasks = useMemo(() => {
    if (!issues) return []
    return issues
      .filter(i => i.status !== 'done' && i.status !== 'canceled' && i.is_deleted === 0)
      .sort((a, b) => {
        const scoreA = PRIORITY_SCORE[a.priority] || 0
        const scoreB = PRIORITY_SCORE[b.priority] || 0
        if (scoreB !== scoreA) return scoreB - scoreA
        
        const daysA = getDaysUntilDue(a.due_date) ?? 9999
        const daysB = getDaysUntilDue(b.due_date) ?? 9999
        return daysA - daysB
      })
  }, [issues])

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-background">

      {/* ── Header bar — y hệt trang Tasks ── */}
      <header className="flex flex-col bg-background shrink-0 select-none">
        <div className="flex items-center justify-between px-4 h-[44px] border-b border-border-main shrink-0">
          <h1 className="text-standard tracking-tight font-medium text-standard-text truncate leading-none">
            Workspace
          </h1>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-3xl mx-auto w-full px-6 py-6 flex flex-col gap-6">

          {/* Section 1: Dashboard Cards (Today's Tasks & Highest Priority Tasks) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Panel 1: Today's Tasks */}
            <div className="bg-surface border border-border-main rounded-xl p-4 flex flex-col min-w-0 shadow-subtle hover:shadow-hover transition-all duration-200">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-main/50">
                <Calendar className="w-4 h-4 text-blue-500" strokeWidth={2} />
                <h3 className="text-xs font-semibold text-foreground tracking-tight">Nhiệm vụ hôm nay</h3>
                {todayTasks.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">
                    {todayTasks.length}
                  </span>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                {todayTasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-center gap-1.5">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500/30" strokeWidth={1.5} />
                    <p className="text-[11px] font-medium text-secondary/60">Không có nhiệm vụ nào cần hoàn thành hôm nay</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {todayTasks.slice(0, 5).map(issue => (
                      <TaskRow key={issue.id} issue={issue} />
                    ))}
                    {todayTasks.length > 5 && (
                      <button
                        onClick={() => navigate('/tasks')}
                        className="text-[10px] text-secondary hover:text-primary font-medium pt-1 text-center transition-colors cursor-pointer"
                      >
                        Xem thêm {todayTasks.length - 5} nhiệm vụ khác →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Panel 2: Highest Priority Tasks */}
            <div className="bg-surface border border-border-main rounded-xl p-4 flex flex-col min-w-0 shadow-subtle hover:shadow-hover transition-all duration-200">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-main/50">
                <Zap className="w-4 h-4 text-amber-500" strokeWidth={2} />
                <h3 className="text-xs font-semibold text-foreground tracking-tight">Ưu tiên cao nhất</h3>
                {priorityTasks.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full">
                    {priorityTasks.filter(i => i.priority === 'urgent' || i.priority === 'high').length}
                  </span>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                {priorityTasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-center gap-1.5">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500/30" strokeWidth={1.5} />
                    <p className="text-[11px] font-medium text-secondary/60">Không có nhiệm vụ ưu tiên nào</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {priorityTasks.slice(0, 5).map(issue => (
                      <TaskRow key={issue.id} issue={issue} />
                    ))}
                    {priorityTasks.length > 5 && (
                      <button
                        onClick={() => navigate('/tasks')}
                        className="text-[10px] text-secondary hover:text-primary font-medium pt-1 text-center transition-colors cursor-pointer"
                      >
                        Xem tất cả nhiệm vụ →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Divider */}
          <div className="border-t border-border-main" />

          {/* Section 2: Library Grid */}
          <section className="pb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-primary/70" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-secondary/70">
                  Library
                </h2>
              </div>
            </div>
            <LibraryGrid
              nodes={nodes}
              onSelectNote={onSelectNote}
              onSelectCanvas={onSelectCanvas}
              onSelectLink={onSelectLink}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
