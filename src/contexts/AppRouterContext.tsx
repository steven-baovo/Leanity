'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

/**
 * AppRouterContext — Bộ não routing trung tâm của toàn bộ app
 *
 * Thay thế TasksRouterContext + phần selection của WorkspaceContext.
 * Parse slug từ window.location.pathname và cung cấp route state cho toàn bộ cây component.
 */

export type RouteType =
  | 'tasks'
  | 'task'       // /task/[id]
  | 'projects'   // /projects
  | 'project'    // /project/[id]
  | 'cycles'     // /cycles
  | 'cycle'      // /cycle/[id]  (dự phòng)
  | 'workspace'  // /workspace
  | 'note'       // /note/[id]
  | 'table'      // /table/[id]
  | 'canvas'     // /canvas/[id]
  | 'link'       // /link/[id]
  | 'graph'      // /graph
  | 'pomodoro'
  | 'productivity'
  | 'okrs'
  | 'home'

export interface RouteState {
  type: RouteType
  id: string | null
}

interface AppRouterContextType {
  route: RouteState
}

const defaultRoute: RouteState = { type: 'home', id: null }

export function parseSlug(slug: string[]): RouteState {
  if (!slug || slug.length === 0) return { type: 'home', id: null }

  const [seg0, seg1] = slug

  switch (seg0) {
    case 'tasks':       return { type: 'tasks', id: null }
    case 'task':        return { type: 'task', id: seg1 ?? null }
    case 'projects':    return { type: 'projects', id: null }
    case 'project':     return { type: 'project', id: seg1 ?? null }
    case 'cycles':      return { type: 'cycles', id: null }
    case 'cycle':       return { type: 'cycle', id: seg1 ?? null }
    case 'workspace':   return { type: 'workspace', id: null }
    case 'note':        return { type: 'note', id: seg1 ?? null }
    case 'table':       return { type: 'table', id: seg1 ?? null }
    case 'canvas':      return { type: 'canvas', id: seg1 ?? null }
    case 'link':        return { type: 'link', id: seg1 ?? null }
    case 'graph':       return { type: 'graph', id: null }
    case 'pomodoro':    return { type: 'pomodoro', id: null }
    case 'productivity':return { type: 'productivity', id: null }
    case 'okrs':        return { type: 'okrs', id: null }
    default:            return { type: 'home', id: null }
  }
}

function parseSlugFromPathname(pathname: string): RouteState {
  const parts = pathname.split('/').filter(Boolean)
  return parseSlug(parts)
}

const AppRouterContext = createContext<AppRouterContextType>({
  route: defaultRoute,
})

export function AppRouterProvider({
  children,
  initialSlug,
}: {
  children: React.ReactNode
  initialSlug?: string[]
}) {
  const [route, setRoute] = useState<RouteState>(() => {
    if (initialSlug && initialSlug.length > 0) return parseSlug(initialSlug)
    if (typeof window !== 'undefined') return parseSlugFromPathname(window.location.pathname)
    return defaultRoute
  })

  const handlePopState = useCallback(() => {
    setRoute(parseSlugFromPathname(window.location.pathname))
  }, [])

  useEffect(() => {
    // Đồng bộ khi mount (phòng trường hợp hydration mismatch)
    setRoute(parseSlugFromPathname(window.location.pathname))

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [handlePopState])

  return (
    <AppRouterContext.Provider value={{ route }}>
      {children}
    </AppRouterContext.Provider>
  )
}

export function useAppRouter() {
  return useContext(AppRouterContext)
}
