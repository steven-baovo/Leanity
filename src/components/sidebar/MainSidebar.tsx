'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppRouter } from '@/contexts/AppRouterContext';
import { useClientNavigate } from '@/hooks/useClientNavigate';
import { Timer, BarChart2, Plus, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebarFrame from '@/components/sidebar/AppSidebarFrame';
import TasksSection from './TasksSection';
import WorkspaceSection from './WorkspaceSection';
import SidebarHeader from './SidebarHeader';

export default function MainSidebar() {
  const { route } = useAppRouter();
  const { navigate } = useClientNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPomodoroActive = mounted && route.type === 'pomodoro';
  const isProductivityActive = mounted && route.type === 'productivity';
  const isAnyActive = isPomodoroActive || isProductivityActive;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // 200ms delay to prevent accidental closing
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const actionItems = [
    {
      href: '/docs',
      title: 'Tài liệu hướng dẫn',
      icon: HelpCircle,
      active: false,
      newTab: true,
    },
    {
      href: '/pomodoro',
      title: 'Tập trung Pomodoro',
      icon: Timer,
      active: isPomodoroActive,
    },
    {
      href: '/productivity',
      title: 'Báo cáo năng suất',
      icon: BarChart2,
      active: isProductivityActive,
    },
  ];

  return (
    <AppSidebarFrame defaultWidth={300}>
      <div className="w-full h-full flex flex-col pt-[10px] px-4 pb-4 select-none">
        {/* Header containing User Profile Dropdown */}
        <SidebarHeader />

        {/* Cột scroll chứa Tasks và Workspace */}
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar gap-2">
          <TasksSection />
          
          <WorkspaceSection />
        </div>

        {/* Action Control Button (Speed Dial) ở dưới cùng bên phải */}
        <div 
          className="relative flex flex-col items-end pt-4 mt-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Menu mở rộng phía trên */}
          <AnimatePresence>
            {isHovered && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-full mb-2 right-0 flex flex-col gap-2 z-50"
              >
                {actionItems.map((item, idx) => {
                  const Icon = item.icon;
                  const handleClick = () => {
                    if (item.newTab) {
                      window.open(item.href, '_blank', 'noopener,noreferrer');
                    } else {
                      navigate(item.href);
                    }
                  };
                  return (
                    <button
                      key={idx}
                      onClick={handleClick}
                      className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-subtle hover:shadow-floating hover:scale-105 active:scale-95 cursor-pointer ${
                        item.active
                          ? 'bg-primary text-white border border-transparent'
                          : 'bg-white dark:bg-zinc-900 border border-border-main hover:border-border-strong text-secondary hover:text-foreground'
                      }`}
                    >
                      {/* Tooltip bên trái của nút */}
                      <span className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-zinc-950/90 text-white dark:bg-white/95 dark:text-zinc-900 text-[9px] font-bold rounded border border-zinc-800 dark:border-zinc-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap translate-x-1 group-hover:translate-x-0 z-50">
                        {item.title}
                      </span>
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nút Trigger chính */}
          <button
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-subtle hover:shadow-floating hover:scale-105 active:scale-95 cursor-pointer ${
              isHovered || isAnyActive
                ? 'bg-primary text-white border border-transparent'
                : 'bg-white dark:bg-zinc-900 border border-border-main hover:border-border-strong text-secondary hover:text-foreground'
            }`}
            aria-label="Bảng điều khiển hành động"
          >
            <motion.div
              animate={{ rotate: isHovered ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Plus className="w-5 h-5" strokeWidth={1.5} />
            </motion.div>
          </button>
        </div>
      </div>
    </AppSidebarFrame>
  );
}
