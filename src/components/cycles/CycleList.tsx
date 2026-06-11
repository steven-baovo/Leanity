'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useClientNavigate } from '@/hooks/useClientNavigate';
import { History, Plus, Calendar, Activity, ChevronRight, Box, Target, CheckSquare } from 'lucide-react';
import { useLocalCycles, useLocalIssues } from '@/lib/local-first/useLocalTasks';
import { getCycleIcon } from '@/types/models';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function CycleList() {
  const { navigate } = useClientNavigate();
  const { cycles: dbCycles, addCycle } = useLocalCycles();
  const { issues: dbIssues } = useLocalIssues();

  const handleCreateCycle = async () => {
    const name = window.prompt('Nhập tên chu kỳ mới:');
    if (!name || !name.trim()) return;
    const newId = await addCycle({
      name: name.trim(),
      is_active: false
    });
    if (newId) navigate(`/cycle/${newId}`);
  };

  const cyclesData = useMemo(() => {
    if (!dbCycles) return [];
    
    return dbCycles.map(c => {
      const cycleIssues = (dbIssues || []).filter(i => i.cycle_id === c.id && i.status !== 'canceled');
      const doneIssues = cycleIssues.filter(i => i.status === 'done');
      const progress = cycleIssues.length > 0 ? Math.round((doneIssues.length / cycleIssues.length) * 100) : 0;
      const isUpcoming = c.start_date ? new Date() < new Date(c.start_date) : false;

      return {
        id: c.id,
        name: c.name,
        isActive: c.is_active,
        isUpcoming,
        startDate: c.start_date || '',
        endDate: c.end_date || '',
        progress,
        issuesCount: cycleIssues.length
      };
    }).sort((a, b) => {
      // Sort: Active first, then upcoming, then past
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      if (a.isUpcoming && !b.isUpcoming) return -1;
      if (!a.isUpcoming && b.isUpcoming) return 1;
      
      // If both are upcoming: sort ascending (earliest first)
      if (a.isUpcoming && b.isUpcoming) {
        return a.startDate.localeCompare(b.startDate);
      }
      
      // If both are past: sort descending (most recent past first)
      return b.startDate.localeCompare(a.startDate);
    });
  }, [dbCycles, dbIssues]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      {/* Header */}
      <header className="flex flex-col bg-background shrink-0 select-none">
        {/* Dòng 1: Thanh điều hướng phân đoạn */}
        <div className="flex items-stretch justify-between px-4 h-[44px] border-b border-border-main shrink-0">
          <div className="flex items-stretch gap-6 h-full text-xs select-none">
            <button
              onClick={() => navigate('/tasks')}
              className="h-full flex items-center gap-1.5 px-1 border-b-2 -mb-[1px] text-[12px] transition-all cursor-pointer border-transparent text-zinc-400 dark:text-zinc-500 hover:text-foreground hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks</span>
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="h-full flex items-center gap-1.5 px-1 border-b-2 -mb-[1px] text-[12px] transition-all cursor-pointer border-transparent text-zinc-400 dark:text-zinc-500 hover:text-foreground hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Project</span>
            </button>
            <button
              onClick={() => navigate('/okrs')}
              className="h-full flex items-center gap-1.5 px-1 border-b-2 -mb-[1px] text-[12px] transition-all cursor-pointer border-transparent text-zinc-400 dark:text-zinc-500 hover:text-foreground hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <Target className="w-3.5 h-3.5" />
              <span>OKRs</span>
            </button>
            <button
              onClick={() => navigate('/cycles')}
              className="h-full flex items-center gap-1.5 px-1 border-b-2 -mb-[1px] text-[12px] transition-all cursor-pointer border-zinc-900 dark:border-zinc-100 text-foreground font-semibold"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Cycle</span>
            </button>
          </div>
        </div>

        {/* Dòng 2: Thanh công cụ dưới đường viền */}
        <div className="flex items-center justify-end gap-4 flex-wrap p-4">
          {/* Nhóm bên phải: Nút Tạo chu kỳ */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCreateCycle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[11px] font-semibold rounded-md shadow-subtle transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cycle</span>
            </button>
          </div>
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-8">
          {cyclesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 gap-4">
              {getCycleIcon("w-12 h-12 text-zinc-300 dark:text-zinc-700")}
              <p className="text-sm">Chưa có chu kỳ nào được tạo.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-zinc-300 via-zinc-200 to-transparent dark:from-zinc-600 dark:via-zinc-700 dark:to-transparent" />

              <div className="flex flex-col gap-6">
                {cyclesData.map((cycle, index) => (
                  <div key={cycle.id} className="relative flex items-start gap-4">
                    {/* Timeline node + branch line */}
                    <div className="relative shrink-0 flex flex-col items-center" style={{ width: 32 }}>
                      {/* Horizontal branch line */}
                      <div className="absolute top-4 left-[15px] w-[18px] h-px bg-zinc-300 dark:bg-zinc-600" style={{ left: '100%', top: '50%', transform: 'translateY(-50%)' }} />
                      {/* Status circle node */}
                      {cycle.isActive ? (
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 flex items-center justify-center border border-green-200 dark:border-green-900/50 relative z-10">
                          <Activity className="w-4 h-4 animate-pulse" />
                        </div>
                      ) : cycle.isUpcoming ? (
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900/50 relative z-10">
                          <Calendar className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 flex items-center justify-center border border-border-main relative z-10">
                          {getCycleIcon("w-4 h-4")}
                        </div>
                      )}
                    </div>

                    {/* Card content */}
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/cycle/${cycle.id}`);
                      }}
                      className="group flex-1 flex flex-col sm:flex-row sm:items-center gap-4 py-2.5 px-4 bg-transparent hover:bg-hover-bg/30 transition-all cursor-pointer text-xs rounded-lg ml-3"
                    >
                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {cycle.name}
                          </h3>
                          {cycle.isActive ? (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[9px] font-bold rounded-sm uppercase tracking-wider">
                              Active
                            </span>
                          ) : cycle.isUpcoming ? (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-[9px] font-bold rounded-sm uppercase tracking-wider">
                              Upcoming
                            </span>
                          ) : null}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" />
                            <span>{cycle.issuesCount} tasks</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="w-full sm:w-48 flex items-center gap-3 shrink-0">
                        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-zinc-800 dark:bg-zinc-200 h-full rounded-full transition-all duration-300"
                            style={{ width: `${cycle.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-zinc-500 w-8 text-right">{cycle.progress}%</span>
                      </div>

                      <div className="shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors hidden sm:block">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
