'use client'

import { useEffect } from 'react'
import { useAppRouter } from '@/contexts/AppRouterContext'
import { useLocalWorkspace } from '@/lib/local-first/useLocalWorkspace'
import { useLocalIssues, useLocalProjects, useLocalCycles } from '@/lib/local-first/useLocalTasks'

export default function TitleManager() {
  const { route } = useAppRouter()
  const { nodes } = useLocalWorkspace()
  const { issues } = useLocalIssues()
  const { projects } = useLocalProjects()
  const { cycles } = useLocalCycles()

  useEffect(() => {
    let subTitle = ''

    switch (route.type) {
      case 'tasks':
        subTitle = 'Công việc'
        break
      case 'task': {
        const item = issues?.find(i => i.id === route.id)
        subTitle = item ? item.title : 'Chi tiết công việc'
        break
      }
      case 'projects':
        subTitle = 'Dự án'
        break
      case 'project': {
        const item = projects?.find(p => p.id === route.id)
        subTitle = item ? item.name : 'Chi tiết dự án'
        break
      }
      case 'cycles':
        subTitle = 'Chu kỳ'
        break
      case 'cycle': {
        const item = cycles?.find(c => c.id === route.id)
        subTitle = item ? item.name : 'Chi tiết chu kỳ'
        break
      }
      case 'workspace':
        subTitle = 'Workspace'
        break
      case 'note': {
        const item = nodes?.find(n => n.type === 'note' && n.note_id === route.id)
        subTitle = item ? item.title : 'Tài liệu'
        break
      }
      case 'canvas': {
        const item = nodes?.find(n => n.type === 'map' && n.map_id === route.id)
        subTitle = item ? item.title : 'Canvas'
        break
      }
      case 'link': {
        const item = nodes?.find(n => n.type === 'link' && n.id === route.id)
        subTitle = item ? item.title : 'Link'
        break
      }
      case 'graph':
        subTitle = 'Graph View'
        break
      case 'pomodoro':
        subTitle = 'Pomodoro'
        break
      case 'productivity':
        subTitle = 'Productivity'
        break
      case 'okrs':
        subTitle = 'OKRs'
        break
      case 'home':
        subTitle = 'Trang chủ'
        break
      default:
        subTitle = ''
    }

    if (subTitle) {
      document.title = `Leanity - ${subTitle}`
    } else {
      document.title = 'Leanity - Quản Lý Năng Suất, Ghi Chép Tài Liệu & Đồng Hồ Pomodoro'
    }
  }, [route, nodes, issues, projects, cycles])

  return null
}
