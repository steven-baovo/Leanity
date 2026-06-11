'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useClientNavigate } from '@/hooks/useClientNavigate';
import { useLocalObjectives, useLocalKeyResults } from '@/lib/local-first/useLocalOKRs';
import { useLocalProjects, useLocalIssues } from '@/lib/local-first/useLocalTasks';
import { Plus, Target, Target as TargetIcon, ChevronDown, ChevronRight, BarChart2, Briefcase, Activity, CheckCircle2, Pencil, Trash2, X, Box, CheckSquare } from 'lucide-react';
import { getProjectStatusIcon, getProjectStatusLabel } from '@/types/models';

function ObjectiveNode({ obj, krs, projects, onAddKR, onUpdateObj, onDeleteObj, onDeleteKR, onLinkProject, projectProgress }: any) {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActions, setIsEditingActions] = useState(false);
  const [editTitle, setEditTitle] = useState(obj.title);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditingActions) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsEditingActions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isEditingActions]);

  const totalKRs = krs.length;
  const objectiveScore = totalKRs > 0
    ? krs.reduce((sum: number, kr: any) => {
        const krProgress = kr.target_value !== kr.initial_value 
          ? Math.min(100, Math.max(0, ((kr.current_value - kr.initial_value) / (kr.target_value - kr.initial_value)) * 100))
          : 0;
        return sum + (krProgress / 100);
      }, 0) / totalKRs
    : 0;

  return (
    <div className="mb-4">
      <div className="flex items-start gap-2 group pr-12 relative">
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="w-6 h-6 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 shrink-0"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="w-5 h-5 flex items-center justify-center rounded border border-border-main bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5">
          <Target className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
        </div>
        
        <div className="flex-1 min-w-0 flex items-start gap-3">
          <div className="flex-1 min-w-0 animate-fade-in">
            {isEditing ? (
              <input
                type="text"
                className="w-full bg-transparent border-b border-blue-500 outline-none text-foreground text-sm font-semibold py-0.5"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => {
                  if (editTitle.trim() && editTitle !== obj.title) {
                    onUpdateObj(obj.id, { title: editTitle.trim() });
                  }
                  setIsEditing(false);
                }}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                autoFocus
              />
            ) : (
              <span 
                className="text-sm font-semibold text-foreground cursor-pointer hover:text-blue-500 transition-colors block break-words"
                onClick={() => setIsEditing(true)}
              >
                {obj.title}
              </span>
            )}
          </div>

          {/* Progress and Score of Objective */}
          <div className="w-28 shrink-0 flex items-center justify-end gap-2 mt-1">
            <div className="w-16 h-1.5 bg-active-bg rounded-full overflow-hidden shrink-0" title={`Tiến độ: ${Math.round(objectiveScore * 100)}%`}>
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${objectiveScore * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-secondary shrink-0 text-right w-8">
              {objectiveScore.toFixed(1)}
            </span>
          </div>
        </div>

        <div className={`absolute right-1 top-0.5 flex items-center gap-1 transition-all ${isEditingActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingActions(!isEditingActions);
            }}
            className={`p-1 rounded transition-colors ${isEditingActions ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-zinc-400 hover:text-blue-500 hover:bg-blue-50'}`}
            title="Thao tác"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        {isEditingActions && (
          <div 
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-1 top-8 z-[100] w-48 bg-surface border border-border-main rounded-lg shadow-xl p-1.5 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150 text-left"
          >
            <button
              onClick={() => {
                onAddKR(obj.id);
                setIsEditingActions(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-hover-bg rounded-md transition-colors w-full text-left font-medium"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Thêm Kết quả then chốt</span>
            </button>
            <button
              onClick={() => {
                onDeleteObj(obj.id);
                setIsEditingActions(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors w-full text-left font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Mục tiêu</span>
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="ml-[28px] pl-[36px] mt-2 relative pb-2">
          {krs.length === 0 ? (
            <div className="text-xs text-zinc-400 italic py-2 relative">
              <div className="absolute -left-[52px] top-0 h-[15px] border-l border-border-strong" />
              <div className="absolute -left-[52px] top-[15px] w-[17px] border-t border-border-strong" />
              Chưa có Key Result nào.
            </div>
          ) : (
            krs.map((kr: any, idx: number) => (
              <KeyResultNode 
                key={kr.id} 
                kr={kr} 
                projects={projects.filter((p: any) => p.key_result_id === kr.id)} 
                allProjects={projects}
                onLinkProject={onLinkProject}
                onDeleteKR={onDeleteKR}
                isFirst={idx === 0}
                isLast={idx === krs.length - 1}
                projectProgress={projectProgress}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function KeyResultNode({ kr, projects, allProjects, onLinkProject, onDeleteKR, isFirst, isLast, projectProgress }: any) {
  const { navigate } = useClientNavigate();
  const [expanded, setExpanded] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingActions, setIsEditingActions] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const { updateKeyResult } = useLocalKeyResults();
  
  const popoverRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditingActions) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsEditingActions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isEditingActions]);

  useEffect(() => {
    if (!isLinking) return;
    const handleOutside = (e: MouseEvent) => {
      if (linkRef.current && !linkRef.current.contains(e.target as Node)) {
        setIsLinking(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isLinking]);

  // Local state for editing
  const [editTitle, setEditTitle] = useState(kr.title);
  const [editInitial, setEditInitial] = useState(kr.initial_value);
  const [editTarget, setEditTarget] = useState(kr.target_value);
  const [editCurrent, setEditCurrent] = useState(kr.current_value);
  const [editMetric, setEditMetric] = useState(kr.metric_name || '');

  const progress = kr.target_value !== kr.initial_value 
    ? Math.min(100, Math.max(0, ((kr.current_value - kr.initial_value) / (kr.target_value - kr.initial_value)) * 100))
    : 0;

  const handleDelete = () => {
    onDeleteKR(kr.id);
  };

  return (
    <div className="relative pt-4 pb-2">
      <div 
        className={`absolute -left-[52px] border-l border-border-strong ${isFirst ? 'top-[-12px]' : 'top-0'} ${isLast ? (isFirst ? 'h-[39px]' : 'h-[27px]') : 'bottom-0'}`} 
      />
      <div className="absolute -left-[52px] top-[27px] w-[17px] border-t border-border-strong" />
      
      <div className="flex items-start gap-2 group pr-12 relative">
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="w-6 h-6 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 shrink-0"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <div className="w-4 h-4 flex items-center justify-center rounded border border-border-main bg-zinc-100 dark:bg-zinc-800 text-[8px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0 mt-1">KR</div>
        
        <div className="flex-1 min-w-0 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                className="w-full bg-transparent border-b border-blue-500 outline-none text-foreground text-sm font-medium py-0.5"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => {
                  if (editTitle.trim() && editTitle !== kr.title) {
                    updateKeyResult(kr.id, { title: editTitle.trim() });
                  }
                  setIsEditingTitle(false);
                }}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                autoFocus
              />
            ) : (
              <span 
                className="text-sm font-medium text-foreground cursor-pointer hover:text-blue-500 transition-colors block break-words"
                onClick={() => {
                  setEditTitle(kr.title);
                  setIsEditingTitle(true);
                }}
              >
                {kr.title}
              </span>
            )}
          </div>

          {/* Progress and values column on the right, aligned perfectly */}
          <div className="w-28 shrink-0 flex items-center justify-end gap-2 mt-1">
            {/* Short Progress Bar */}
            <div className="w-16 h-1.5 bg-active-bg rounded-full overflow-hidden shrink-0" title={`Tiến độ: ${Math.round(progress)}%`}>
              <div 
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Completion Score (Google Style) */}
            <span className="text-xs font-mono text-secondary shrink-0 text-right w-8">
              {(progress / 100).toFixed(1)}
            </span>
          </div>
        </div>
        
        <div className={`absolute right-1 top-0.5 flex items-center gap-1 transition-all ${isEditingActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingActions(!isEditingActions);
            }}
            className={`p-1 rounded transition-colors ${isEditingActions ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-zinc-400 hover:text-blue-500 hover:bg-blue-50'}`}
            title="Thao tác"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        {isEditingActions && (
          <div 
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-1 top-8 z-[100] w-72 bg-surface border border-border-main rounded-lg shadow-xl p-3 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150 text-left"
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setIsLinking(true);
                  setIsEditingActions(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-hover-bg rounded-md transition-colors w-full text-left font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-400" />
                <span>Liên kết Dự án (Project)</span>
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setIsEditingActions(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors w-full text-left font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Kết quả then chốt</span>
              </button>
            </div>
            
            <div className="border-t border-border-main" />

            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cập nhật tiến trình</div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Bắt Đầu</label>
                  <input 
                    type="number" 
                    className="w-full bg-background border border-border-main rounded px-2 py-1 text-xs outline-none focus:border-blue-500 text-foreground" 
                    value={editInitial} 
                    onChange={e => setEditInitial(Number(e.target.value))} 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Hiện Tại</label>
                  <input 
                    type="number" 
                    className="w-full bg-background border border-border-main rounded px-2 py-1 text-xs outline-none focus:border-blue-500 text-foreground" 
                    value={editCurrent} 
                    onChange={e => setEditCurrent(Number(e.target.value))} 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Mục Tiêu</label>
                  <input 
                    type="number" 
                    className="w-full bg-background border border-border-main rounded px-2 py-1 text-xs outline-none focus:border-blue-500 text-foreground" 
                    value={editTarget} 
                    onChange={e => setEditTarget(Number(e.target.value))} 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Đơn Vị</label>
                  <input 
                    type="text" 
                    className="w-full bg-background border border-border-main rounded px-2 py-1 text-xs outline-none focus:border-blue-500 text-foreground" 
                    value={editMetric} 
                    onChange={e => setEditMetric(e.target.value)} 
                    placeholder="users, %..." 
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <button 
                  onClick={() => {
                    setEditInitial(kr.initial_value);
                    setEditCurrent(kr.current_value);
                    setEditTarget(kr.target_value);
                    setEditMetric(kr.metric_name || '');
                    setIsEditingActions(false);
                  }} 
                  className="text-[11px] text-zinc-500 hover:text-foreground px-2 py-1 rounded transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    updateKeyResult(kr.id, {
                      initial_value: Number(editInitial) || 0,
                      current_value: Number(editCurrent) || 0,
                      target_value: Number(editTarget) || 0,
                      metric_name: editMetric.trim()
                    });
                    setIsEditingActions(false);
                  }} 
                  className="text-[11px] bg-blue-500 text-white px-3 py-1 rounded font-medium hover:bg-blue-600 shadow-sm transition-colors"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div className="ml-[34px] pl-[40px] mt-2 relative space-y-2 py-2">
          {projects.length === 0 ? (
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 relative py-1">
              <div className={`absolute -left-[62px] top-[-10px] border-l border-border-strong ${!isLinking ? 'h-[20px]' : 'bottom-0'}`} />
              <div className="absolute -left-[62px] top-[10px] w-[20px] border-t border-border-strong" />
              <Briefcase className="w-3 h-3" />
              Chưa có dự án nào liên kết.
            </div>
          ) : (
            projects.map((p: any, idx: number) => {
              const isLastProj = idx === projects.length - 1;
              return (
                <div 
                  key={p.id} 
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="relative flex items-center gap-2 text-xs py-3 pr-12 pl-2 hover:bg-hover-bg rounded-md group/proj cursor-pointer"
                >
                  <div className={`absolute -left-[62px] top-[-10px] border-l border-border-strong ${isLastProj && !isLinking ? 'h-[30px]' : 'bottom-0'}`} />
                  <div className="absolute -left-[62px] top-[20px] w-[20px] border-t border-border-strong" />
                
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-zinc-400/80 shrink-0" />
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">{p.name}</span>
                  <span className="text-[10px] text-zinc-400 opacity-0 group-hover/proj:opacity-100 transition-opacity ml-2 shrink-0">
                    {getProjectStatusLabel(p.status)}
                  </span>
                </div>

                {/* Progress Column - Styled as a Progress Circle on the right edge */}
                <div className="flex items-center gap-2 ml-auto shrink-0 select-none pr-1">
                  <div className="relative w-4 h-4 flex items-center justify-center shrink-0" title={`Tiến độ: ${projectProgress[p.id] || 0}%`}>
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeWidth="1.5" />
                      <circle 
                        cx="8" 
                        cy="8" 
                        r="6" 
                        fill="none" 
                        stroke="currentColor" 
                        className="text-blue-500" 
                        strokeDasharray="37.7" 
                        strokeDashoffset={37.7 - (37.7 * (projectProgress[p.id] || 0)) / 100} 
                        strokeWidth="1.5" 
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-mono font-medium text-secondary shrink-0 text-right w-10">
                    {projectProgress[p.id] || 0}%
                  </span>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); onLinkProject(p.id, null); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/proj:opacity-100 text-zinc-400 hover:text-red-500 transition-all p-0.5 rounded"
                  title="Gỡ liên kết"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )})
          )}
          
          {isLinking && (
            <div className="relative mt-1">
              <div className="absolute -left-[62px] top-[-10px] h-[24px] border-l border-border-strong" />
              <div className="absolute -left-[62px] top-[14px] w-[20px] border-t border-border-strong" />
              <div 
                ref={linkRef}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 p-2 bg-zinc-50 dark:bg-zinc-900/50 border border-border-main rounded-md w-64 max-w-sm"
              >
                <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Chọn dự án để liên kết</div>
                <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {allProjects.filter((p: any) => p.key_result_id !== kr.id).length === 0 ? (
                    <div className="text-[10px] text-zinc-400 italic px-1">Không còn dự án nào khác.</div>
                  ) : (
                    allProjects.filter((p: any) => p.key_result_id !== kr.id).map((p: any) => (
                      <button 
                        key={p.id} 
                        onClick={() => { onLinkProject(p.id, kr.id); setIsLinking(false); }}
                        className="text-left flex items-center gap-2 text-xs p-1.5 hover:bg-hover-bg rounded-md transition-colors"
                      >
                        <Box className="w-3.5 h-3.5 text-zinc-400/80 shrink-0" />
                        <span className="flex-1 truncate">{p.name}</span>
                      </button>
                    ))
                  )}
                </div>
                <button onClick={() => setIsLinking(false)} className="text-[10px] text-zinc-400 mt-2 hover:text-foreground w-full text-center">Hủy</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OKRView() {
  const { navigate } = useClientNavigate();
  const { objectives, addObjective, updateObjective, deleteObjective } = useLocalObjectives();
  const { key_results, addKeyResult, deleteKeyResult } = useLocalKeyResults();
  const { projects, updateProject } = useLocalProjects();
  const { issues: dbIssues } = useLocalIssues();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDeleteObjective = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Mục tiêu (Objective)',
      message: 'Bạn có chắc chắn muốn xóa Mục tiêu này và toàn bộ Kết quả then chốt (KRs) trực thuộc? Hành động này không thể hoàn tác.',
      onConfirm: () => {
        deleteObjective(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteKR = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Kết quả then chốt (Key Result)',
      message: 'Bạn có chắc chắn muốn xóa Kết quả then chốt này? Tất cả các liên kết dự án trực thuộc sẽ bị gỡ bỏ.',
      onConfirm: () => {
        deleteKeyResult(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleLinkProject = (projectId: string, keyResultId: string | null) => {
    updateProject(projectId, { key_result_id: keyResultId });
  };

  // Calculate progress for each project matching how it's done in TasksSection.tsx
  const projectProgress: Record<string, number> = {};
  if (projects) {
    const issuesList = dbIssues || [];
    projects.forEach((p: any) => {
      const projIssues = issuesList.filter((i: any) => i.project_id === p.id && i.status !== 'canceled');
      if (projIssues.length === 0) {
        projectProgress[p.id] = 0;
      } else {
        const doneIssues = projIssues.filter((i: any) => i.status === 'done');
        projectProgress[p.id] = Math.round((doneIssues.length / projIssues.length) * 100);
      }
    });
  }

  const handleAddObjective = async () => {
    await addObjective({
      title: 'Mục tiêu mới',
    });
  };

  const handleAddKR = async (objectiveId: string) => {
    await addKeyResult({
      objective_id: objectiveId,
      title: 'Kết quả then chốt mới',
      initial_value: 0,
      target_value: 100,
      current_value: 0,
      metric_name: '%'
    });
  };

  if (!objectives || !key_results || !projects) {
    return <div className="p-8 flex items-center justify-center h-full"><Activity className="w-5 h-5 text-zinc-400 animate-spin" /></div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="flex flex-col bg-background shrink-0 select-none">
        {/* Dòng 1: Tiêu đề chính */}
        <div className="flex items-center justify-between px-4 h-[44px] border-b border-border-main shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-standard tracking-tight font-medium text-standard-text truncate leading-none">Task Center</h1>
          </div>
        </div>

        {/* Dòng 2: Thanh công cụ dưới đường viền */}
        <div className="flex items-center justify-between gap-4 flex-wrap p-4">
          {/* Nhóm bên trái: Điều hướng phân đoạn (Segmented Tabs) */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-border-main p-1 rounded-lg text-xs select-none">
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-foreground rounded-md text-[11px] font-medium transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks</span>
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-foreground rounded-md text-[11px] font-medium transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Project</span>
            </button>
            <button
              onClick={() => navigate('/okrs')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-md text-[11px] font-semibold transition-all cursor-pointer border border-transparent"
            >
              <Target className="w-3.5 h-3.5" />
              <span>OKRs</span>
            </button>
            <button
              onClick={() => navigate('/cycles')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-foreground rounded-md text-[11px] font-medium transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Cycle</span>
            </button>
          </div>

          {/* Nhóm bên phải: Nút Tạo Mục tiêu */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleAddObjective}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[11px] font-semibold rounded-md shadow-subtle transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Objective</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto">
          {objectives.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border-main rounded-xl">
              <Target className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-zinc-500 mb-1">Chưa có mục tiêu nào</h3>
              <p className="text-sm text-zinc-400 mb-4">Bắt đầu bằng cách tạo Objective lớn đầu tiên của bạn.</p>
              <button onClick={handleAddObjective} className="text-sm text-blue-500 hover:underline">Tạo Objective</button>
            </div>
          ) : (
            objectives.map(obj => (
              <ObjectiveNode
                key={obj.id}
                obj={obj}
                krs={key_results.filter(kr => kr.objective_id === obj.id)}
                projects={projects}
                onAddKR={handleAddKR}
                onUpdateObj={updateObjective}
                onDeleteObj={handleDeleteObjective}
                onDeleteKR={handleDeleteKR}
                onLinkProject={handleLinkProject}
                projectProgress={projectProgress}
              />
            ))
          )}
        </div>
      </div>
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-transparent p-4 animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onCancel} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-surface border border-border-main rounded-xl shadow-2xl overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200 gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
          <p className="text-xs text-secondary leading-relaxed">{message}</p>
        </div>
        
        <div className="flex items-center justify-end gap-2.5 mt-2">
          <button 
            onClick={onCancel} 
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-500 hover:text-foreground hover:bg-hover-bg rounded-md transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={onConfirm} 
            className="px-3.5 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors shadow-sm"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
