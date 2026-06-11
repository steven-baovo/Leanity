'use client'

import React, { useMemo, useState, useContext } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/local-first/db'
import { useClientNavigate } from '@/hooks/useClientNavigate'
import { TasksContext } from '@/lib/local-first/TasksProvider'
import { LocalIssue } from '@/lib/local-first/db'
import {
  AlertCircle,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap,
  Calendar,
  Timer,
  CheckSquare,
  Activity,
  TrendingUp,
  Award,
  Briefcase,
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
    score += Math.max(0, 365 - days)
  }
  if (issue.status === 'in_progress') score += 50
  else if (issue.status === 'todo') score += 30
  return score
}

// ─── Task Card & Badges ───────────────────────────────────────────────────────

function getPriorityIcon(priority: string) {
  const cls = 'w-3.5 h-3.5 shrink-0 text-secondary/70 group-hover:text-foreground transition-colors'
  switch (priority) {
    case 'urgent': return <AlertCircle className={cls} />
    case 'high': return <ChevronsUp className={cls} />
    case 'medium': return <ChevronUp className={cls} />
    case 'low': return <ChevronDown className={cls} />
    default: return <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-1 shrink-0" />
  }
}

function DueDateBadge({ dueDateStr }: { dueDateStr: string | null | undefined }) {
  const days = getDaysUntilDue(dueDateStr)
  if (days === null) return null

  let label = ''
  let cls = 'text-secondary bg-active-bg'

  if (days < 0) {
    label = `Quá hạn ${Math.abs(days)} ngày`
    cls = 'text-red-500 dark:text-red-400 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10'
  } else if (days === 0) {
    label = 'Hôm nay'
    cls = 'text-primary dark:text-primary/90 bg-primary/5 border border-primary/10'
  } else if (days === 1) {
    label = 'Ngày mai'
    cls = 'text-secondary bg-active-bg'
  } else if (days <= 3) {
    label = `Còn ${days} ngày`
    cls = 'text-secondary bg-active-bg'
  } else {
    const d = new Date(dueDateStr!)
    label = `${d.getDate()}/${d.getMonth() + 1}`
    cls = 'text-secondary bg-active-bg'
  }

  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border border-transparent ${cls} shrink-0`}>
      <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
      {label}
    </span>
  )
}

function TaskRow({ issue }: { issue: LocalIssue }) {
  const { navigate } = useClientNavigate()

  return (
    <div
      onClick={() => navigate('/tasks')}
      className="group flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-hover-bg transition-colors duration-150 cursor-pointer min-w-0"
    >
      {/* Priority icon (Monochrome and clean) */}
      <span className="shrink-0">
        {getPriorityIcon(issue.priority)}
      </span>

      {/* Task Title */}
      <span className="flex-1 text-[12px] font-normal text-foreground truncate select-none">
        {issue.title}
      </span>

      {/* Due date Badge */}
      {issue.due_date && <DueDateBadge dueDateStr={issue.due_date} />}

      {/* Hover Arrow */}
      <ArrowRight className="w-3 h-3 text-secondary/40 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity ml-1" />
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function WorkspaceHome() {
  const { navigate } = useClientNavigate()
  const { issues } = useContext(TasksContext)

  // Query focus sessions from database
  const sessions = useLiveQuery(() => db.focus_sessions.toArray()) || []

  // --- 1. TÍNH TOÁN CÁC CHỈ SỐ TỔNG QUAN (METRICS) ---
  const stats = useMemo(() => {
    const completedPomodoros = sessions.filter(s => s.is_completed && s.session_type === 'pomodoro')
    const totalFocusMinutes = completedPomodoros.reduce((sum, s) => sum + s.duration_minutes, 0)
    const completedIssuesCount = (issues || []).filter(i => i.status === 'done' && i.is_deleted === 0).length
    const pendingIssuesCount = (issues || []).filter(i => i.status !== 'done' && i.status !== 'canceled' && i.is_deleted === 0).length

    const hours = Math.floor(totalFocusMinutes / 60)
    const mins = totalFocusMinutes % 60
    const focusTimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

    return {
      focusTimeStr,
      pomodorosCount: completedPomodoros.length,
      completedIssuesCount,
      pendingIssuesCount,
      totalFocusMinutes
    }
  }, [sessions, issues])

  const [range, setRange] = useState<'week' | 'month' | 'year'>('week')

  // --- 2. TÍNH TOÁN DỮ LIỆU XU HƯỚNG HOÀN THÀNH TASK ---
  const completedTasksData = useMemo(() => {
    if (!issues) return []
    const doneTasks = issues.filter(i => i.status === 'done' && i.is_deleted === 0)
    const now = new Date()

    if (range === 'week') {
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(now.getDate() - i)
        const dateString = d.toISOString().split('T')[0]
        
        const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        const dayLabel = daysOfWeek[d.getDay()]
        
        const count = doneTasks.filter(t => {
          const tDate = t.updated_at ? t.updated_at.split('T')[0] : ''
          return tDate === dateString
        }).length

        days.push({
          label: dayLabel,
          count,
          date: dateString
        })
      }
      return days
    } else if (range === 'month') {
      const days = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(now.getDate() - i)
        const dateString = d.toISOString().split('T')[0]
        
        const dayLabel = String(d.getDate())
        
        const count = doneTasks.filter(t => {
          const tDate = t.updated_at ? t.updated_at.split('T')[0] : ''
          return tDate === dateString
        }).length

        days.push({
          label: dayLabel,
          count,
          date: dateString
        })
      }
      return days
    } else {
      // range === 'year'
      const months = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date()
        d.setMonth(now.getMonth() - i)
        
        const year = d.getFullYear()
        const monthNum = d.getMonth() + 1
        
        const monthLabel = `T${monthNum}`
        
        const count = doneTasks.filter(t => {
          if (!t.updated_at) return false
          const tDate = new Date(t.updated_at)
          return tDate.getFullYear() === year && (tDate.getMonth() + 1) === monthNum
        }).length

        months.push({
          label: monthLabel,
          count,
          date: `${year}-${String(monthNum).padStart(2, '0')}`
        })
      }
      return months
    }
  }, [issues, range])

  const maxCount = useMemo(() => {
    const max = Math.max(...completedTasksData.map(d => d.count), 0)
    return max === 0 ? 5 : max
  }, [completedTasksData])

  // --- 3. PHÂN BỔ THỜI GIAN (POMO VS BREAK) ---
  const timeAllocation = useMemo(() => {
    let focus = 0
    let breakTime = 0

    sessions.forEach(s => {
      if (!s.is_completed) return
      if (s.session_type === 'pomodoro') {
        focus += s.duration_minutes
      } else {
        breakTime += s.duration_minutes
      }
    })

    const total = focus + breakTime
    const focusPercent = total > 0 ? Math.round((focus / total) * 100) : 100
    const breakPercent = total > 0 ? Math.round((breakTime / total) * 100) : 0

    return {
      focus,
      breakTime,
      focusPercent,
      breakPercent,
      total
    }
  }, [sessions])

  // --- 4. DANH SÁCH NHIỆM VỤ HOÀN THÀNH GẦN ĐÂY ---
  const recentlyCompletedTasks = useMemo(() => {
    return (issues || [])
      .filter(i => i.status === 'done' && i.is_deleted === 0)
      .map(i => ({
        id: i.id,
        title: i.title,
        completedAt: i.updated_at
      }))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 5)
  }, [issues])

  // --- 5. LỊCH SỬ CÁC PHIÊN TẬP TRUNG GẦN ĐÂY ---
  const recentSessions = useMemo(() => {
    return [...sessions]
      .filter(s => s.is_completed && s.session_type === 'pomodoro')
      .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
      .slice(0, 5)
      .map(s => {
        const matchedIssue = (issues || []).find(i => i.id === s.task_id)
        return {
          id: s.id,
          taskTitle: matchedIssue ? matchedIssue.title : 'Tập trung tự do',
          duration: s.duration_minutes,
          completedAt: s.completed_at || s.created_at
        }
      })
  }, [sessions, issues])

  // --- 6. NHIỆM VỤ HÔM NAY VÀ ƯU TIÊN CAO NHẤT ---
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
      {/* Header */}
      <header className="flex flex-col bg-background shrink-0 select-none">
        <div className="flex items-center justify-between px-4 h-[44px] border-b border-border-main shrink-0">
          <h1 className="text-standard tracking-tight font-medium text-standard-text truncate leading-none">
            Workspace
          </h1>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">

          {/* Row 1: Bento Grid Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            {/* Metric 1: Total time */}
            <div className="p-4 bg-surface border border-border-main rounded-default shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-secondary font-medium tracking-tight uppercase">Tổng thời gian</p>
                <h3 className="text-sm sm:text-base font-black text-foreground truncate mt-0.5">{stats.focusTimeStr}</h3>
              </div>
            </div>

            {/* Metric 2: Pomodoros */}
            <div className="p-4 bg-surface border border-border-main rounded-default shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-secondary font-medium tracking-tight uppercase">Pomodoro</p>
                <h3 className="text-sm sm:text-base font-black text-foreground truncate mt-0.5">{stats.pomodorosCount} phiên</h3>
              </div>
            </div>

            {/* Metric 3: Completed */}
            <div className="p-4 bg-surface border border-border-main rounded-default shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-secondary font-medium tracking-tight uppercase">Đã hoàn thành</p>
                <h3 className="text-sm sm:text-base font-black text-foreground truncate mt-0.5">{stats.completedIssuesCount} task</h3>
              </div>
            </div>

            {/* Metric 4: Pending */}
            <div className="p-4 bg-surface border border-border-main rounded-default shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-secondary font-medium tracking-tight uppercase">Đang xử lý</p>
                <h3 className="text-sm sm:text-base font-black text-foreground truncate mt-0.5">{stats.pendingIssuesCount} task</h3>
              </div>
            </div>
          </div>

          {/* Row 2: Today's Tasks & Highest Priority Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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



          {/* Row 4: Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart Completed Tasks Trend (Col-span: 2) */}
            <div className="lg:col-span-2 p-5 bg-surface border border-border-main rounded-default shadow-subtle flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h2 className="text-[13px] font-black text-foreground uppercase tracking-tight">Xu hướng hoàn thành task</h2>
                </div>
                
                <div className="flex items-center gap-3 ml-auto">
                  {/* Segmented Range Switcher */}
                  <div className="flex bg-active-bg rounded-lg p-0.5 border border-border-main shrink-0">
                    {(['week', 'month', 'year'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                          range === r
                            ? 'bg-surface text-foreground shadow-sm'
                            : 'text-secondary hover:text-foreground'
                        }`}
                      >
                        {r === 'week' ? 'Tuần' : r === 'month' ? 'Tháng' : 'Năm'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-end justify-between gap-1.5 pt-6 px-1">
                {completedTasksData.map((item, idx) => {
                  const heightPercent = Math.max((item.count / maxCount) * 100, 4)
                  const barWidthClass = range === 'week' 
                    ? 'w-8 sm:w-12' 
                    : range === 'month' 
                      ? 'w-2 sm:w-3.5' 
                      : 'w-6 sm:w-10'
                  
                  const shouldShowLabel = range !== 'month' || idx === 0 || idx === 29 || idx % 5 === 4

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="w-full relative flex items-end justify-center h-40">
                        <div className="absolute bottom-full mb-1.5 px-2 py-0.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {item.count} task
                        </div>
                        <div 
                          style={{ height: `${heightPercent}%` }} 
                          className={`${barWidthClass} rounded-t-sm transition-all duration-500 ${
                            item.count > 0 
                              ? 'bg-primary group-hover:bg-primary/80' 
                              : 'bg-zinc-100 dark:bg-zinc-800/40'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-secondary font-medium tracking-tight mt-1 h-4">
                        {shouldShowLabel ? item.label : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Time Allocation Pie Chart (Col-span: 1) */}
            <div className="p-5 bg-surface border border-border-main rounded-default shadow-subtle flex flex-col items-center justify-between min-h-[300px]">
              <div className="w-full flex items-center gap-2 mb-4 self-start">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h2 className="text-[13px] font-black text-foreground uppercase tracking-tight">Phân bổ hoạt động</h2>
              </div>

              <div className="relative w-36 h-36 flex items-center justify-center my-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeWidth="3" />
                  {stats.totalFocusMinutes > 0 && (
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15.915" 
                      fill="none" 
                      stroke="currentColor" 
                      className="text-primary" 
                      strokeWidth="3.2" 
                      strokeDasharray={`${timeAllocation.focusPercent} ${100 - timeAllocation.focusPercent}`} 
                      strokeDashoffset="0" 
                    />
                  )}
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-foreground leading-none">{timeAllocation.focusPercent}%</span>
                  <span className="text-[9px] text-secondary uppercase font-bold tracking-wider mt-0.5">Tập trung</span>
                </div>
              </div>

              <div className="w-full space-y-2 mt-4">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-medium text-secondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span>Tập trung</span>
                  </div>
                  <span className="font-bold text-foreground">{timeAllocation.focusPercent}% ({timeAllocation.focus}m)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-medium text-secondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span>Nghỉ ngơi</span>
                  </div>
                  <span className="font-bold text-foreground">{timeAllocation.breakPercent}% ({timeAllocation.breakTime}m)</span>
                </div>
              </div>
            </div>
          </div>

          {/* History & Lists Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
            {/* Completed Tasks List */}
            <div className="p-5 bg-surface border border-border-main rounded-default shadow-subtle flex flex-col min-h-[250px]">
              <h2 className="text-[13px] font-black text-foreground uppercase tracking-tight mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" />
                <span>Nhiệm vụ hoàn thành gần đây</span>
              </h2>

              <div className="flex-1 space-y-3">
                {recentlyCompletedTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[12px] text-secondary/70 italic py-10">
                    Chưa có nhiệm vụ nào được hoàn thành gần đây
                  </div>
                ) : (
                  recentlyCompletedTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2.5 rounded hover:bg-hover-bg transition-colors border border-border-main bg-background/50">
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <p className="text-[12px] font-medium text-foreground truncate">{task.title}</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-secondary shrink-0 font-bold ml-2">
                        Dự án
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Focus History List */}
            <div className="p-5 bg-surface border border-border-main rounded-default shadow-subtle flex flex-col min-h-[250px]">
              <h2 className="text-[13px] font-black text-foreground uppercase tracking-tight mb-4 flex items-center gap-2">
                <Timer className="w-4 h-4 text-amber-500" />
                <span>Lịch sử tập trung gần đây</span>
              </h2>

              <div className="flex-1 space-y-3">
                {recentSessions.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[12px] text-secondary/70 italic py-10">
                    Chưa có lịch sử phiên tập trung nào
                  </div>
                ) : (
                  recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-2.5 rounded hover:bg-hover-bg transition-colors border border-border-main bg-background/50">
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <p className="text-[12px] font-medium text-foreground truncate">{session.taskTitle}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          +{session.duration}m
                        </span>
                        <span className="text-[10px] text-secondary">
                          {new Date(session.completedAt).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
