'use client'

import { useState, useEffect } from 'react'
import { ListTodo, FileText, Timer, Menu } from 'lucide-react'
import Link from 'next/link'
import { useAppRouter } from '@/contexts/AppRouterContext'
import { motion } from 'framer-motion'
import { useFocus } from '@/contexts/FocusContext'

const NAV_ITEMS = [
  { icon: ListTodo, label: 'Tasks', href: '/tasks', prefixes: ['/tasks', '/task/', '/project/', '/projects', '/cycle/', '/cycles'] },
  { icon: FileText, label: 'Workspace', href: '/workspace', prefixes: ['/workspace', '/note/', '/canvas/', '/link/', '/graph'] },
  { icon: Timer, label: 'Focus', href: '/pomodoro', prefixes: ['/pomodoro'] },
]

interface MobileNavbarProps {
  onMenuClick: () => void
}

export default function MobileNavbar({ onMenuClick }: MobileNavbarProps) {
  const { route } = useAppRouter()
  const focus = useFocus()
  const [workspaceHref, setWorkspaceHref] = useState('/workspace')

  return (
    <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
      <div className="relative p-1 flex items-center justify-around">
        {/* Background Layer with clipping for the glow */}
        <div className="absolute inset-0 glass backdrop-blur-2xl bg-white/70 border border-white/20 -premium rounded-[24px] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        </div>
        
        {NAV_ITEMS.map((item) => {
          const isWorkspace = item.label === 'Workspace'
          const targetHref = isWorkspace ? workspaceHref : item.href
          
          let isActive = false
          if (item.label === 'Tasks') {
            isActive = ['tasks', 'task', 'project', 'projects', 'cycle', 'cycles'].includes(route.type)
          } else if (item.label === 'Workspace') {
            isActive = ['workspace', 'note', 'canvas', 'link', 'graph'].includes(route.type)
          } else if (item.label === 'Focus') {
            isActive = ['pomodoro'].includes(route.type)
          }

          const Icon = item.icon

          const isFocus = item.label === 'Focus'

          return (
            <Link 
              key={item.href} 
              href={targetHref}
              className="relative flex flex-col items-center justify-center w-14 h-12 group"
            >
              <div className={`
                flex items-center justify-center rounded-xl transition-all duration-300 relative
                ${isActive ? 'w-8 h-8 bg-primary text-white' : 'w-7 h-7 text-secondary hover:text-primary'}
              `}>
                <Icon strokeWidth={isActive ? 2.5 : 2} className="w-4 h-4 relative z-10" />
                
                {/* Timer indicator on Focus icon */}
                {isFocus && focus.isActive && (
                  <span className="absolute top-0 right-0 flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${focus.mode === 'pomodoro' ? 'bg-primary' : 'bg-green-500'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${focus.mode === 'pomodoro' ? 'bg-primary' : 'bg-green-500'}`}></span>
                  </span>
                )}
              </div>
              
              <span className={`text-[8px] font-black uppercase tracking-widest mt-1 transition-colors ${isActive ? 'text-primary' : 'text-secondary/80'}`}>
                {item.label}
              </span>

              {isActive && (
                <motion.div 
                  layoutId="mobile-nav-indicator"
                  className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}

        {/* Menu Button */}
        <button 
          onClick={(e) => {
            e.preventDefault()
            onMenuClick()
          }}
          className="relative flex flex-col items-center justify-center w-14 h-12 group"
        >
          <div className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:text-primary transition-colors">
            <Menu strokeWidth={2} className="w-4 h-4 relative z-10" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-secondary/80 transition-colors group-hover:text-primary">
            Menu
          </span>
        </button>
      </div>
    </nav>
  )
}
