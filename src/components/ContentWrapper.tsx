'use client'

import { useEffect, useState } from 'react'
import { useAppRouter } from '@/contexts/AppRouterContext'

export default function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { route } = useAppRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])
  
  // Fixed pages (iframes, canvas boards, graphs, pomodoro) must never scroll at the page level
  const isFixedPage = mounted && (
                      route.type === 'note' || 
                      route.type === 'link' || 
                      route.type === 'canvas' || 
                      route.type === 'graph' || 
                      route.type === 'pomodoro' ||
                      route.type === 'table'
                    )
  
  const isWorkspace = mounted && route.type === 'workspace'
  
  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden relative bg-surface border border-border-main lg:rounded-none lg:border-y-0 lg:border-r-0 lg:border-l`}>
      <main
        className={`flex-1 min-w-0 min-h-0 h-full relative ${
          isFixedPage
            ? 'overflow-hidden'
            : isWorkspace
              ? 'overflow-y-auto lg:overflow-hidden no-scrollbar'
              : 'overflow-y-auto no-scrollbar'
        }`}
        style={isFixedPage ? { overscrollBehavior: 'none' } : undefined}
      >
        <div className={`w-full ${ isFixedPage ? 'h-full' : isWorkspace ? 'min-h-full lg:h-full' : 'min-h-full' }`}>
          {children}
        </div>
      </main>
    </div>
  )
}
