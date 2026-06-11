'use client'

import { useState, useEffect, Suspense } from 'react'

import { WorkspaceProvider } from "@/contexts/WorkspaceContext"
import { FocusProvider } from "@/contexts/FocusContext"
import { TasksProvider } from "@/lib/local-first/TasksProvider"
import { QuickCreateProvider } from "@/contexts/QuickCreateContext"
import { AppRouterProvider } from "@/contexts/AppRouterContext"
import MobileNavigationWrapper from "@/components/MobileNavigationWrapper"
import ContentWrapper from "@/components/ContentWrapper"
import SyncInitializer from "@/components/SyncInitializer"
import MainSidebar from "@/components/sidebar/MainSidebar"
import GlobalKeyboardListener from "@/components/GlobalKeyboardListener"
import QuickCreateModal from "@/components/shared/QuickCreateModal"

export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 1. Tải user từ localStorage đồng bộ ngay lập tức để render Sidebar
    const cachedUser = localStorage.getItem('mindlabs-user')
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser))
      } catch (e) {
        console.error('Failed to parse cached user', e)
      }
    }

    // 2. Chạy ngầm xác thực session thực tế với NextAuth
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session')
        const session = await res.json()
        if (session?.user) {
          setUser(session.user)
          localStorage.setItem('mindlabs-user', JSON.stringify(session.user))
        } else {
          setUser(null)
          localStorage.removeItem('mindlabs-user')
        }
      } catch (err) {
        console.error('Error during layout session check:', err)
      }
    }

    checkSession()
  }, [])

  return (
    <AppRouterProvider>
    <FocusProvider>
      <TasksProvider>
        <QuickCreateProvider>
          <WorkspaceProvider>
          {user && <SyncInitializer />}
          {/* Global shortcuts */}
          <GlobalKeyboardListener />
          <QuickCreateModal />
          <div className="flex flex-col lg:flex-row h-screen bg-[#fcfdfe] dark:bg-background overflow-hidden p-[5px] gap-[5px] lg:p-0 lg:gap-0">
            {/* Mobile Navigation */}
            <MobileNavigationWrapper user={user} />

            {/* Desktop Sidebar */}
            <div className="hidden lg:block h-full">
              <Suspense fallback={<div className="w-[240px] h-full bg-[#f8fafc] animate-pulse" />}>
                <MainSidebar />
              </Suspense>
            </div>

            {/* Main Content Island */}
            <ContentWrapper>{children}</ContentWrapper>
          </div>
          </WorkspaceProvider>
        </QuickCreateProvider>
      </TasksProvider>
    </FocusProvider>
    </AppRouterProvider>
  )
}
