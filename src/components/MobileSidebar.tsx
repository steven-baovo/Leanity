'use client'

import React, { useState, useEffect } from 'react'

import { 
  X, 
  Home, 
  Search, 
  FileText,
  Timer,
  ListTodo
} from 'lucide-react'
import Link from 'next/link'
import { useAppRouter } from '@/contexts/AppRouterContext'
import { motion, AnimatePresence } from 'framer-motion'
import UserMenu from './UserMenu'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  user: any
  profile: any
}

const MENU_ITEMS = [
  { title: 'Nhiệm vụ', icon: ListTodo, href: '/tasks' },
  { title: 'Workspace', icon: FileText, href: '/workspace' },
  { title: 'MindFocus', icon: Timer, href: '/pomodoro' },
]



export default function MobileSidebar({ isOpen, onClose, user, profile }: MobileSidebarProps) {
  const { route } = useAppRouter()
  const [workspaceHref, setWorkspaceHref] = useState('/workspace')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] lg:hidden"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white z-[160] lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-border-main">
              <Link href="/" onClick={onClose} className="flex items-center gap-2 group">
                <img 
                  src="/logo.svg" 
                  alt="Mindlabs Logo" 
                  className="w-8 h-8 rounded-full object-contain group-hover:scale-105 transition-transform duration-300" 
                />
                <span className="text-lg font-black tracking-tighter text-foreground">
                  Mindlabs
                </span>
              </Link>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-50 rounded-full text-secondary hover:text-foreground active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8 no-scrollbar">
              {/* Primary Menu */}
              <div className="flex flex-col gap-1">
                <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/80 mb-2">Điều hướng</span>
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isWorkspace = item.title === 'Workspace'
                  
                  let isActive = false
                  if (item.title === 'Nhiệm vụ') {
                    isActive = ['tasks', 'task', 'project', 'projects', 'cycle', 'cycles'].includes(route.type)
                  } else if (item.title === 'Workspace') {
                    isActive = ['workspace', 'note', 'canvas', 'link', 'graph'].includes(route.type)
                  } else if (item.title === 'MindFocus') {
                    isActive = ['pomodoro'].includes(route.type)
                  }

                  const finalHref = isWorkspace ? workspaceHref : item.href
                  return (
                    <Link
                      key={item.href}
                      href={finalHref}
                      prefetch={true}
                      onClick={onClose}
                      className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${isActive ? 'bg-primary/5 text-primary font-bold' : 'text-secondary hover:bg-gray-50'}`}
                    >

                      <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-secondary'}`} />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  )
                })}
              </div>


            </div>

            {/* Footer / User Profile */}
            <div className="p-6 border-t border-border-main bg-gray-50/50">
              {user ? (
                <div className="flex items-center gap-4">
                  <UserMenu user={user} profile={profile} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground truncate">{profile?.display_name || 'User'}</span>
                    <span className="text-xs text-secondary truncate">{user?.email}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" onClick={onClose} className="px-4 py-3 rounded-2xl bg-gray-100 text-center text-sm font-black uppercase tracking-widest text-foreground">Login</Link>
                  <Link href="/register" onClick={onClose} className="px-4 py-3 rounded-2xl bg-primary text-white text-center text-sm font-black uppercase tracking-widest">Join</Link>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
