'use client';

import React, { useState, useEffect } from 'react';
import { useAppRouter } from '@/contexts/AppRouterContext';
import { useClientNavigate } from '@/hooks/useClientNavigate';
import { usePathname } from 'next/navigation';
import { Plus, Folder, Layers, Keyboard, Command, X, CheckSquare, Settings, Box, History, ChevronDown } from 'lucide-react';
import { useLocalProjects, useLocalCycles, useLocalIssues } from '@/lib/local-first/useLocalTasks';
import { MockProject, MockCycle, getCycleIcon } from '@/types/models';
import { runAutoCycleEngine } from '@/lib/local-first/cycle-engine';
import { SIDEBAR_STYLES } from '@/lib/sidebar-styles';

export default function TasksSection() {
  const pathname = usePathname();
  const { route } = useAppRouter();
  const { navigate } = useClientNavigate();
  const { projects: dbProjects } = useLocalProjects();
  const { cycles: dbCycles } = useLocalCycles();
  const { issues: dbIssues } = useLocalIssues();

  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isCyclesExpanded, setIsCyclesExpanded] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Cycle Settings States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cyclesEnabled, setCyclesEnabled] = useState(true);
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [startDay, setStartDay] = useState(1);
  const [autoTransfer, setAutoTransfer] = useState(true);
  const [showPastCycles, setShowPastCycles] = useState(false);

  // Kích hoạt chạy engine chu kỳ khi sidebar được tải
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const enabled = localStorage.getItem('cycles_enabled') !== 'false';
      setCyclesEnabled(enabled);
      if (enabled) {
        runAutoCycleEngine();
      }

      const handleSyncComplete = () => {
        const currentlyEnabled = localStorage.getItem('cycles_enabled') !== 'false';
        if (currentlyEnabled) {
          runAutoCycleEngine();
        }
      };

      window.addEventListener('mindlabs-sync-complete', handleSyncComplete);
      return () => {
        window.removeEventListener('mindlabs-sync-complete', handleSyncComplete);
      };
    }
  }, []);

  const projects = (dbProjects || []).map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    startDate: p.start_date || '',
    targetDate: p.target_date || ''
  })) as MockProject[];

  const cycles = (dbCycles || []).map(c => ({
    id: c.id,
    name: c.name,
    isActive: c.is_active,
    startDate: c.start_date || '',
    endDate: c.end_date || ''
  })).sort((a, b) => a.startDate.localeCompare(b.startDate)) as MockCycle[];

  const handleSaveSettings = async () => {
    localStorage.setItem('cycles_enabled', cyclesEnabled.toString());
    localStorage.setItem('cycle_duration_weeks', durationWeeks.toString());
    localStorage.setItem('cycle_start_day', startDay.toString());
    localStorage.setItem('auto_transfer_unfinished', autoTransfer.toString());
    
    setIsSettingsOpen(false);
    
    // Chạy lại engine và refresh trang
    if (cyclesEnabled) {
      await runAutoCycleEngine();
    }
    window.location.reload();
  };

  const projectProgress: Record<string, number> = {};
  projects.forEach(p => {
    const projIssues = (dbIssues || []).filter(i => i.project_id === p.id && i.status !== 'canceled');
    if (projIssues.length === 0) {
      projectProgress[p.id] = 0;
    } else {
      const doneIssues = projIssues.filter(i => i.status === 'done');
      projectProgress[p.id] = Math.round((doneIssues.length / projIssues.length) * 100);
    }
  });

  const activeCycle = cycles.find(c => c.isActive);
  const nowStr = new Date().toISOString();

  const upcomingCycles = cycles.filter(c => {
    if (activeCycle) return c.startDate > activeCycle.endDate;
    return c.startDate > nowStr;
  }).slice(0, 2);

  const pastCycles = cycles.filter(c => {
    if (activeCycle) return c.endDate < activeCycle.startDate;
    return c.endDate < nowStr;
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));

  const isMyTasksActive = isClient && route.type === 'tasks';

  return (
    <>
      <div className="flex flex-col gap-2 flex-none shrink-0">
        {/* Main Menu */}
        <div className="space-y-0.5">
          <div
            onClick={(e) => {
              e.preventDefault();
              navigate('/tasks');
            }}
            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md ${SIDEBAR_STYLES.linkText} transition-colors cursor-pointer ${isMyTasksActive ? SIDEBAR_STYLES.linkActive : SIDEBAR_STYLES.linkInactive}`}
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-zinc-400/80" />
              <span>Task Center</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/50 dark:bg-zinc-800/50 text-secondary">{(dbIssues || []).length}</span>
          </div>
        </div>
      </div>
    </>
  );
}
