'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useClientNavigate } from '@/hooks/useClientNavigate';
import { Box, Plus, Calendar, Activity, ChevronRight, Folder, User, Target, CheckSquare } from 'lucide-react';
import { useLocalProjects, useLocalIssues } from '@/lib/local-first/useLocalTasks';
import { getProjectStatusIcon, getProjectStatusLabel, getPriorityIcon } from '@/types/models';

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

const formatTargetDate = (dateStr: string) => {
  if (!dateStr) return 'No date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  let suffix = 'th';
  if (day === 1 || day === 21 || day === 31) suffix = 'st';
  else if (day === 2 || day === 22) suffix = 'nd';
  else if (day === 3 || day === 23) suffix = 'rd';
  return `${month} ${day}${suffix}`;
};

export default function ProjectList() {
  const { navigate } = useClientNavigate();
  const { projects: dbProjects, addProject } = useLocalProjects();
  const { issues: dbIssues } = useLocalIssues();

  const handleCreateProject = async () => {
    const name = window.prompt('Nhập tên dự án mới:');
    if (!name || !name.trim()) return;
    const newId = await addProject({
      name: name.trim(),
      status: 'planned',
      priority: 'none'
    });
    if (newId) navigate(`/project/${newId}`);
  };

  const projectsData = useMemo(() => {
    if (!dbProjects) return [];

    return dbProjects.map(p => {
      const projIssues = (dbIssues || []).filter(i => i.project_id === p.id && i.status !== 'canceled');
      const doneIssues = projIssues.filter(i => i.status === 'done');
      const progress = projIssues.length > 0 ? Math.round((doneIssues.length / projIssues.length) * 100) : 0;

      let health = { label: 'No updates', bgClass: 'border border-dashed border-zinc-300 dark:border-zinc-700', textClass: 'text-zinc-500' };
      if (projIssues.length > 0) {
        if (progress === 100) {
          health = { label: 'Completed', bgClass: 'bg-emerald-500', textClass: 'text-emerald-600 dark:text-emerald-450' };
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          const overdueIssues = projIssues.filter(i => i.status !== 'done' && i.due_date && i.due_date < todayStr);
          if (overdueIssues.length > 0) {
            if (overdueIssues.length >= 3) {
              health = { label: 'Off track', bgClass: 'bg-red-500', textClass: 'text-red-600 dark:text-red-400' };
            } else {
              health = { label: 'At risk', bgClass: 'bg-amber-500', textClass: 'text-amber-600 dark:text-amber-400' };
            }
          } else {
            health = { label: 'On track', bgClass: 'bg-emerald-500', textClass: 'text-emerald-600 dark:text-emerald-450' };
          }
        }
      }

      return {
        id: p.id,
        name: p.name,
        status: p.status || 'planned',
        priority: p.priority || 'none',
        startDate: p.start_date || '',
        targetDate: p.target_date || '',
        description: p.description || '',
        progress,
        issuesCount: projIssues.length,
        health
      };
    }).sort((a, b) => {
      // Sắp xếp: Dự án đang thực hiện trước, sau đó là dự án chuẩn bị, cuối cùng là đã xong
      const statusWeight: Record<string, number> = {
        'started': 1,
        'planned': 2,
        'completed': 3,
        'backlog': 4
      };
      const weightA = statusWeight[a.status] || 5;
      const weightB = statusWeight[b.status] || 5;
      if (weightA !== weightB) return weightA - weightB;
      return a.name.localeCompare(b.name);
    });
  }, [dbProjects, dbIssues]);

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
              className="h-full flex items-center gap-1.5 px-1 border-b-2 -mb-[1px] text-[12px] transition-all cursor-pointer border-zinc-900 dark:border-zinc-100 text-foreground font-semibold"
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
              className="h-full flex items-center gap-1.5 px-1 border-b-2 -mb-[1px] text-[12px] transition-all cursor-pointer border-transparent text-zinc-400 dark:text-zinc-500 hover:text-foreground hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Cycle</span>
            </button>
          </div>
        </div>

        {/* Dòng 2: Thanh công cụ dưới đường viền */}
        <div className="flex items-center justify-end gap-4 flex-wrap p-4">
          {/* Nhóm bên phải: Nút Tạo dự án */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[11px] font-semibold rounded-md shadow-subtle transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Project</span>
            </button>
          </div>
        </div>
      </header>

      {/* Table Headers */}
      {projectsData.length > 0 && (
        <div className="px-6 py-2 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 select-none bg-background shrink-0">
          <div className="max-w-[1400px] mx-auto grid grid-cols-[36px_1fr_120px_80px_120px_60px_100px] items-center gap-4 pl-4 pr-4">
            <div className="col-span-2">Name</div>
            <div>Health</div>
            <div>Priority</div>
            <div>Target date</div>
            <div className="text-center">Issues</div>
            <div className="text-right pr-4">Status</div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto flex flex-col pl-6 pr-6">
          {projectsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-500 gap-4">
              <Folder className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm">Chưa có dự án nào được tạo.</p>
            </div>
          ) : (
            projectsData.map(proj => {
              return (
                <div
                  key={proj.id}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/project/${proj.id}`);
                  }}
                  className="group grid grid-cols-[36px_1fr_120px_80px_120px_60px_100px] items-center gap-4 py-2.5 px-4 bg-transparent hover:bg-hover-bg/30 transition-colors cursor-pointer text-xs"
                >
                  {/* Col 1: Icon & Checkbox */}
                  <div className="flex items-center gap-2 pl-1 select-none">
                    <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-650" />
                    </div>
                  </div>

                  {/* Col 2: Name */}
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-normal text-foreground truncate">{proj.name}</span>
                    {proj.description && (
                      <span className="text-[11px] text-zinc-400 truncate max-w-[240px] font-normal" title={proj.description}>
                        {proj.description}
                      </span>
                    )}
                  </div>

                  {/* Col 3: Health */}
                  <div className="flex items-center select-none pl-2">
                    {proj.health.label === 'No updates' ? (
                      <div className="w-3.5 h-3.5 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 shrink-0" title="No updates" />
                    ) : (
                      <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0" title={`Sức khỏe: ${proj.health.label} | Tiến độ: ${proj.progress}%`}>
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="7"
                            cy="7"
                            r="5"
                            fill="none"
                            stroke="currentColor"
                            className="text-zinc-100 dark:text-zinc-800"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="7"
                            cy="7"
                            r="5"
                            fill="none"
                            stroke="currentColor"
                            className={
                              proj.health.label === 'Off track' ? 'text-red-500' :
                              proj.health.label === 'At risk' ? 'text-amber-500' :
                              'text-emerald-500'
                            }
                            strokeWidth="1.5"
                            strokeDasharray="31.4"
                            strokeDashoffset={31.4 - (31.4 * proj.progress) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Col 4: Priority */}
                  <div className="flex items-center text-zinc-500">
                    {getPriorityIcon(proj.priority, "w-3.5 h-3.5")}
                  </div>

                  {/* Col 5: Target date */}
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[11px] font-medium">{formatTargetDate(proj.targetDate)}</span>
                  </div>

                  {/* Col 6: Issues */}
                  <div className="text-center font-medium text-zinc-500">
                    {proj.issuesCount}
                  </div>

                  {/* Col 7: Status */}
                  <div className="flex items-center justify-end gap-2 text-zinc-500 pr-4">
                    <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0" title={`Tiến độ: ${proj.progress}%`}>
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1.5" />
                        <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" className="text-yellow-500" strokeDasharray="31.4" strokeDashoffset={31.4 - (31.4 * proj.progress) / 100} strokeWidth="1.5" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-semibold w-8 text-right">{proj.progress}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
