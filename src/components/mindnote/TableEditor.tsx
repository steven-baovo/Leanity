'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, Trash2, Palette, X, ChevronRight, Rows, Columns } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnPinningState,
} from '@tanstack/react-table'

interface TableEditorProps {
  data: any
  onChange: (newData: any) => void
}

const CELL_COLORS = [
  { name: 'Không màu', value: null, bg: 'transparent' },
  { name: 'Đỏ', value: 'rgba(239, 68, 68, 0.15)', bg: 'rgba(239, 68, 68, 0.3)' },
  { name: 'Cam', value: 'rgba(249, 115, 22, 0.15)', bg: 'rgba(249, 115, 22, 0.3)' },
  { name: 'Vàng', value: 'rgba(245, 158, 11, 0.15)', bg: 'rgba(245, 158, 11, 0.3)' },
  { name: 'Lục', value: 'rgba(34, 197, 94, 0.15)', bg: 'rgba(34, 197, 94, 0.3)' },
  { name: 'Lam', value: 'rgba(59, 130, 246, 0.15)', bg: 'rgba(59, 130, 246, 0.3)' },
  { name: 'Tím', value: 'rgba(168, 85, 247, 0.15)', bg: 'rgba(168, 85, 247, 0.3)' },
  { name: 'Xám', value: 'rgba(113, 113, 122, 0.15)', bg: 'rgba(113, 113, 122, 0.3)' }
]

const ContextMenuSubMenu = ({ label, icon: Icon, children, isHovered, onMouseEnter, onMouseLeave }: any) => {
  const submenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isHovered && submenuRef.current) {
      const rect = submenuRef.current.getBoundingClientRect()
      if (rect.bottom > window.innerHeight) {
        const overflow = rect.bottom - window.innerHeight + 16
        submenuRef.current.style.transform = `translateY(-${overflow}px)`
      }
    }
  }, [isHovered])

  return (
    <div 
      className="relative flex items-center justify-between px-3 py-1.5 hover:bg-hover-bg cursor-pointer text-secondary hover:text-foreground transition-colors text-[13px] rounded-lg mx-1"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-2.5">
        {Icon ? <Icon className="w-4 h-4 opacity-70" strokeWidth={1.5} /> : <div className="w-4 h-4" />}
        <span>{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 opacity-50" strokeWidth={1.5} />
      {isHovered && (
        <div 
          ref={submenuRef}
          className="absolute left-full top-0 ml-1 bg-surface/95 backdrop-blur-md border border-border-main rounded-xl shadow-overlay py-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-200 z-[110]"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  )
}

const TableEditor = ({ data, onChange }: TableEditorProps) => {
  // Parse data or use default structured layout
  const tableData = useMemo(() => {
    if (data && data.type === 'notion-grid' && Array.isArray(data.columns) && Array.isArray(data.rows)) {
      return data
    }
    // Default fallback
    return {
      type: 'notion-grid',
      columns: ['Type', 'Status', 'UID', 'Password', '2FA', 'Mail'],
      rows: [
        ['', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['', '', '', '', '', '']
      ],
      colWidths: [150, 100, 140, 130, 120, 220],
      cellStyles: {}
    }
  }, [data])

  const { columns, rows, colWidths: savedColWidths, cellStyles = {} } = tableData

  // Parse colWidths safely
  const colWidths = useMemo(() => {
    if (Array.isArray(savedColWidths)) {
      return savedColWidths
    }
    return Array(columns.length).fill(150)
  }, [savedColWidths, columns.length])

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>(tableData.sorting || [])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(tableData.columnVisibility || {})
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(tableData.columnPinning || {})

  // Sync states when tableData loads/changes
  useEffect(() => {
    setSorting(tableData.sorting || [])
    setColumnVisibility(tableData.columnVisibility || {})
    setColumnPinning(tableData.columnPinning || {})
  }, [tableData.sorting, tableData.columnVisibility, tableData.columnPinning])

  // Helper sticky styles cho ghim cột
  const getPinnedStyle = useCallback((column: any): React.CSSProperties => {
    const isPinned = column.getIsPinned()
    if (!isPinned) return {}
    return {
      position: 'sticky' as const,
      left: `${column.getStart('left')}px`,
      zIndex: 10,
      backgroundColor: 'var(--background)',
    }
  }, [])

  // Cấu hình Column Defs cho TanStack Table
  const columnsConfig = useMemo<ColumnDef<string[]>[]>(() => {
    return columns.map((colName: string, index: number) => ({
      id: index.toString(),
      header: colName,
      accessorFn: (row) => row[index],
    }))
  }, [columns])

  // Khởi tạo TanStack Table
  const table = useReactTable({
    data: rows,
    columns: columnsConfig,
    state: {
      sorting,
      columnVisibility,
      columnPinning,
    },
    onSortingChange: (updater) => {
      const nextState = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(nextState)
      triggerChange({ sorting: nextState })
    },
    onColumnVisibilityChange: (updater) => {
      const nextState = typeof updater === 'function' ? updater(columnVisibility) : updater
      setColumnVisibility(nextState)
      triggerChange({ columnVisibility: nextState })
    },
    onColumnPinningChange: (updater) => {
      const nextState = typeof updater === 'function' ? updater(columnPinning) : updater
      setColumnPinning(nextState)
      triggerChange({ columnPinning: nextState })
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // States
  const [activeCell, setActiveCell] = useState<{ rowIndex: number; colIndex: number } | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [contextCell, setContextCell] = useState<{ rowIndex: number; colIndex: number } | null>(null)
  const [localColWidths, setLocalColWidths] = useState<number[] | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Submenu states & helpers
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSubMenuEnter = useCallback((menuId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setActiveSubmenu(menuId)
  }, [])

  const handleSubMenuLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null)
    }, 150)
  }, [])

  const clearSubMenuTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setActiveSubmenu(null)
  }, [])

  // Use local column widths during dragging for high-performance rendering (60fps)
  const activeColWidths = useMemo(() => {
    const baseWidths = localColWidths || colWidths
    // Ensure widths array matches column length
    const result = [...baseWidths]
    while (result.length < columns.length) {
      result.push(150)
    }
    return result
  }, [localColWidths, colWidths, columns.length])

  // Trigger change
  const triggerChange = useCallback((updatedData: any) => {
    onChange({
      type: 'notion-grid',
      ...tableData,
      ...updatedData
    })
  }, [tableData, onChange])

  // Cell editing
  const handleCellBlur = useCallback((rowIndex: number, colIndex: number, newHtml: string) => {
    const newRows = rows.map((row: string[], rIdx: number) => {
      if (rIdx === rowIndex) {
        return row.map((cell: string, cIdx: number) => {
          return cIdx === colIndex ? newHtml : cell
        })
      }
      return row
    })
    triggerChange({ rows: newRows })
  }, [rows, triggerChange])

  // Column renaming
  const handleColumnRename = useCallback((colIndex: number, newTitle: string) => {
    const newColumns = columns.map((col: string, idx: number) => {
      return idx === colIndex ? newTitle : col
    })
    triggerChange({ columns: newColumns })
  }, [columns, triggerChange])

  // --- Menu Actions ---

  // Add Row Above
  const handleAddRowBefore = useCallback((rowIndex: number) => {
    const emptyRow = Array(columns.length).fill('')
    const newRows = [...rows]
    newRows.splice(rowIndex, 0, emptyRow)
    
    // Shift styles down
    const newCellStyles: any = {}
    Object.keys(cellStyles).forEach(key => {
      const [rIdx, cIdx] = key.split('-').map(Number)
      if (rIdx >= rowIndex) {
        newCellStyles[`${rIdx + 1}-${cIdx}`] = cellStyles[key]
      } else {
        newCellStyles[`${rIdx}-${cIdx}`] = cellStyles[key]
      }
    })
    triggerChange({ rows: newRows, cellStyles: newCellStyles })
  }, [rows, columns.length, cellStyles, triggerChange])

  // Add Row Below
  const handleAddRowAfter = useCallback((rowIndex: number) => {
    const emptyRow = Array(columns.length).fill('')
    const newRows = [...rows]
    newRows.splice(rowIndex + 1, 0, emptyRow)

    // Shift styles down
    const newCellStyles: any = {}
    Object.keys(cellStyles).forEach(key => {
      const [rIdx, cIdx] = key.split('-').map(Number)
      if (rIdx > rowIndex) {
        newCellStyles[`${rIdx + 1}-${cIdx}`] = cellStyles[key]
      } else {
        newCellStyles[`${rIdx}-${cIdx}`] = cellStyles[key]
      }
    })
    triggerChange({ rows: newRows, cellStyles: newCellStyles })
  }, [rows, columns.length, cellStyles, triggerChange])

  // Delete Row
  const handleDeleteRowAt = useCallback((rowIndex: number) => {
    if (rows.length <= 1) return
    const newRows = rows.filter((_: any, idx: number) => idx !== rowIndex)
    
    // Shift cell styles up
    const newCellStyles: any = {}
    Object.keys(cellStyles).forEach(key => {
      const [rIdx, cIdx] = key.split('-').map(Number)
      if (rIdx === rowIndex) return
      if (rIdx > rowIndex) {
        newCellStyles[`${rIdx - 1}-${cIdx}`] = cellStyles[key]
      } else {
        newCellStyles[`${rIdx}-${cIdx}`] = cellStyles[key]
      }
    })

    triggerChange({ rows: newRows, cellStyles: newCellStyles })
  }, [rows, cellStyles, triggerChange])

  // Add Column Left
  const handleAddColumnBefore = useCallback((colIndex: number) => {
    const newColumns = [...columns]
    newColumns.splice(colIndex, 0, `Cột mới`)
    
    const newRows = rows.map((row: string[]) => {
      const newRow = [...row]
      newRow.splice(colIndex, 0, '')
      return newRow
    })

    // Shift widths
    const newWidths = [...colWidths]
    newWidths.splice(colIndex, 0, 150)

    // Shift styles right
    const newCellStyles: any = {}
    Object.keys(cellStyles).forEach(key => {
      const [rIdx, cIdx] = key.split('-').map(Number)
      if (cIdx >= colIndex) {
        newCellStyles[`${rIdx}-${cIdx + 1}`] = cellStyles[key]
      } else {
        newCellStyles[`${rIdx}-${cIdx}`] = cellStyles[key]
      }
    })
    triggerChange({ columns: newColumns, rows: newRows, colWidths: newWidths, cellStyles: newCellStyles })
  }, [columns, rows, colWidths, cellStyles, triggerChange])

  // Add Column Right
  const handleAddColumnAfter = useCallback((colIndex: number) => {
    const newColumns = [...columns]
    newColumns.splice(colIndex + 1, 0, `Cột mới`)

    const newRows = rows.map((row: string[]) => {
      const newRow = [...row]
      newRow.splice(colIndex + 1, 0, '')
      return newRow
    })

    // Shift widths
    const newWidths = [...colWidths]
    newWidths.splice(colIndex + 1, 0, 150)

    // Shift styles right
    const newCellStyles: any = {}
    Object.keys(cellStyles).forEach(key => {
      const [rIdx, cIdx] = key.split('-').map(Number)
      if (cIdx > colIndex) {
        newCellStyles[`${rIdx}-${cIdx + 1}`] = cellStyles[key]
      } else {
        newCellStyles[`${rIdx}-${cIdx}`] = cellStyles[key]
      }
    })
    triggerChange({ columns: newColumns, rows: newRows, colWidths: newWidths, cellStyles: newCellStyles })
  }, [columns, rows, colWidths, cellStyles, triggerChange])

  // Delete Column
  const handleDeleteColumnAt = useCallback((colIndex: number) => {
    if (columns.length <= 1) return

    const newColumns = columns.filter((_: any, idx: number) => idx !== colIndex)
    const newRows = rows.map((row: string[]) => row.filter((_: any, idx: number) => idx !== colIndex))
    const newWidths = colWidths.filter((_: any, idx: number) => idx !== colIndex)

    // Shift cell styles left
    const newCellStyles: any = {}
    Object.keys(cellStyles).forEach(key => {
      const [rIdx, cIdx] = key.split('-').map(Number)
      if (cIdx === colIndex) return
      if (cIdx > colIndex) {
        newCellStyles[`${rIdx}-${cIdx - 1}`] = cellStyles[key]
      } else {
        newCellStyles[`${rIdx}-${cIdx}`] = cellStyles[key]
      }
    })

    triggerChange({ columns: newColumns, rows: newRows, colWidths: newWidths, cellStyles: newCellStyles })
  }, [columns, rows, colWidths, cellStyles, triggerChange])

  // Apply cell styling
  const handleApplyCellColorAt = useCallback((rowIndex: number, colIndex: number, color: string | null) => {
    const key = `${rowIndex}-${colIndex}`
    const newCellStyles = { ...cellStyles }

    if (color === null) {
      delete newCellStyles[key]
    } else {
      newCellStyles[key] = { backgroundColor: color }
    }

    triggerChange({ cellStyles: newCellStyles })
  }, [cellStyles, triggerChange])

  // Reset/Clear Table
  const handleClearTable = useCallback(() => {
    if (confirm('Bạn có chắc chắn muốn làm sạch toàn bộ bảng và khôi phục về mặc định không?')) {
      triggerChange({
        columns: ['Type', 'Status', 'UID', 'Password', '2FA', 'Mail'],
        rows: [
          ['', '', '', '', '', ''],
          ['', '', '', '', '', ''],
          ['', '', '', '', '', '']
        ],
        colWidths: [150, 100, 140, 130, 120, 220],
        cellStyles: {}
      })
    }
  }, [triggerChange])

  // Right click handler
  const handleContextMenu = (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setContextCell({ rowIndex, colIndex })
    setMenuPos({ x: e.clientX, y: e.clientY })
  }

  // Column resizing mouse handler
  const handleResizeStart = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    
    const startX = e.clientX
    const startWidth = activeColWidths[colIndex] || 150
    let currentWidths = [...activeColWidths]

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const newWidth = Math.max(60, startWidth + deltaX) // Min column width 60px
      
      const nextWidths = [...currentWidths]
      nextWidths[colIndex] = newWidth
      setLocalColWidths(nextWidths)
      currentWidths = nextWidths
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      
      triggerChange({ colWidths: currentWidths })
      setLocalColWidths(null)
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Dismiss menu on global click
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Chỉ đóng menu khi click chuột trái (button = 0) bên ngoài menu
      if (e.button !== 0) return
      
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return
      }
      setMenuPos(null)
      setActiveSubmenu(null)
    }
    window.addEventListener('mousedown', handleGlobalClick)
    return () => window.removeEventListener('mousedown', handleGlobalClick)
  }, [])

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isResizing) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return

    // Reorder columns
    const newColumns = [...columns]
    const [draggedColumn] = newColumns.splice(sourceIndex, 1)
    newColumns.splice(targetIndex, 0, draggedColumn)

    // Reorder column widths
    const newWidths = [...colWidths]
    const [draggedWidth] = newWidths.splice(sourceIndex, 1)
    newWidths.splice(targetIndex, 0, draggedWidth)

    // Reorder rows cells
    const newRows = rows.map((row: string[]) => {
      const newRow = [...row]
      const [draggedCell] = newRow.splice(sourceIndex, 1)
      newRow.splice(targetIndex, 0, draggedCell)
      return newRow
    })

    // Reorder cell styles
    const newCellStyles: any = {}
    Object.keys(cellStyles).forEach(key => {
      const [rIdx, cIdx] = key.split('-').map(Number)
      let newCIdx = cIdx
      if (cIdx === sourceIndex) {
        newCIdx = targetIndex
      } else if (sourceIndex < targetIndex && cIdx > sourceIndex && cIdx <= targetIndex) {
        newCIdx = cIdx - 1
      } else if (sourceIndex > targetIndex && cIdx < sourceIndex && cIdx >= targetIndex) {
        newCIdx = cIdx + 1
      }
      newCellStyles[`${rIdx}-${newCIdx}`] = cellStyles[key]
    })

    setActiveCell(null)
    triggerChange({ columns: newColumns, rows: newRows, colWidths: newWidths, cellStyles: newCellStyles })
  }

  return (
    <div className="relative w-full flex flex-col">
      {/* Context Menu (Obsidian Style) */}
      {menuPos && contextCell && (
        <div
          ref={menuRef}
          className="fixed z-[100] bg-surface/95 backdrop-blur-md border border-border-main rounded-xl shadow-overlay py-1.5 min-w-[230px] animate-in fade-in zoom-in-95 duration-100 select-none text-left"
          style={{ top: menuPos.y, left: menuPos.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Row Actions (Submenu) */}
          <ContextMenuSubMenu
            label="Hàng"
            icon={Rows}
            isHovered={activeSubmenu === 'rowActions'}
            onMouseEnter={() => handleSubMenuEnter('rowActions')}
            onMouseLeave={handleSubMenuLeave}
          >
            <button
              onClick={() => {
                handleAddRowBefore(contextCell.rowIndex)
                setMenuPos(null)
                setActiveSubmenu(null)
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-hover-bg text-secondary hover:text-foreground text-[13px] transition-colors rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
              <span>Thêm hàng phía trên</span>
            </button>
            
            <button
              onClick={() => {
                handleAddRowAfter(contextCell.rowIndex)
                setMenuPos(null)
                setActiveSubmenu(null)
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-hover-bg text-secondary hover:text-foreground text-[13px] transition-colors rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
              <span>Thêm hàng phía dưới</span>
            </button>

            {rows.length > 1 && (
              <button
                onClick={() => {
                  handleDeleteRowAt(contextCell.rowIndex)
                  setMenuPos(null)
                  setActiveSubmenu(null)
                }}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-red-500/10 text-secondary hover:text-red-500 text-[13px] transition-colors rounded-lg cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Xóa hàng này</span>
              </button>
            )}
          </ContextMenuSubMenu>

          <div className="h-[1px] bg-border-main my-1" onMouseEnter={clearSubMenuTimeout} />

          {/* Column Actions (Submenu) */}
          <ContextMenuSubMenu
            label="Cột"
            icon={Columns}
            isHovered={activeSubmenu === 'columnActions'}
            onMouseEnter={() => handleSubMenuEnter('columnActions')}
            onMouseLeave={handleSubMenuLeave}
          >
            <button
              onClick={() => {
                handleAddColumnBefore(contextCell.colIndex)
                setMenuPos(null)
                setActiveSubmenu(null)
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-hover-bg text-secondary hover:text-foreground text-[13px] transition-colors rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
              <span>Thêm cột bên trái</span>
            </button>
            
            <button
              onClick={() => {
                handleAddColumnAfter(contextCell.colIndex)
                setMenuPos(null)
                setActiveSubmenu(null)
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-hover-bg text-secondary hover:text-foreground text-[13px] transition-colors rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
              <span>Thêm cột bên phải</span>
            </button>

            {columns.length > 1 && (
              <button
                onClick={() => {
                  handleDeleteColumnAt(contextCell.colIndex)
                  setMenuPos(null)
                  setActiveSubmenu(null)
                }}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-red-500/10 text-secondary hover:text-red-500 text-[13px] transition-colors rounded-lg cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Xóa cột này</span>
              </button>
            )}

            <div className="h-[1px] bg-border-main my-1" />

            <button
              onClick={() => {
                table.getColumn(contextCell.colIndex.toString())?.toggleSorting(false)
                setMenuPos(null)
                setActiveSubmenu(null)
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-hover-bg text-secondary hover:text-foreground text-[13px] transition-colors rounded-lg cursor-pointer"
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center text-[11px]">🔼</span>
              <span>Sắp xếp A → Z (Tăng)</span>
            </button>
            
            <button
              onClick={() => {
                table.getColumn(contextCell.colIndex.toString())?.toggleSorting(true)
                setMenuPos(null)
                setActiveSubmenu(null)
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-hover-bg text-secondary hover:text-foreground text-[13px] transition-colors rounded-lg cursor-pointer"
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center text-[11px]">🔽</span>
              <span>Sắp xếp Z → A (Giảm)</span>
            </button>

            {table.getColumn(contextCell.colIndex.toString())?.getIsSorted() && (
              <button
                onClick={() => {
                  table.getColumn(contextCell.colIndex.toString())?.clearSorting()
                  setMenuPos(null)
                  setActiveSubmenu(null)
                }}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-hover-bg text-secondary hover:text-foreground text-[13px] transition-colors rounded-lg cursor-pointer"
              >
                <span className="w-3.5 h-3.5 flex items-center justify-center text-[11px]">❌</span>
                <span>Bỏ sắp xếp</span>
              </button>
            )}

            <div className="h-[1px] bg-border-main my-1" />

            <button
              onClick={() => {
                const column = table.getColumn(contextCell.colIndex.toString())
                const isPinned = column?.getIsPinned()
                column?.pin(isPinned === 'left' ? false : 'left')
                setMenuPos(null)
                setActiveSubmenu(null)
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-hover-bg text-secondary hover:text-foreground text-[13px] transition-colors rounded-lg cursor-pointer"
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center text-[11px]">📌</span>
              <span>
                {table.getColumn(contextCell.colIndex.toString())?.getIsPinned() === 'left'
                  ? 'Bỏ ghim cột'
                  : 'Ghim cột bên trái'}
              </span>
            </button>

            <button
              onClick={() => {
                table.getColumn(contextCell.colIndex.toString())?.toggleVisibility(false)
                setMenuPos(null)
                setActiveSubmenu(null)
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-hover-bg text-secondary hover:text-foreground text-[13px] transition-colors rounded-lg cursor-pointer"
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center text-[11px]">👁️</span>
              <span>Ẩn cột này</span>
            </button>
          </ContextMenuSubMenu>

          <div className="h-[1px] bg-border-main my-1" onMouseEnter={clearSubMenuTimeout} />

          {/* Cell Coloring */}
          <div className="px-3 py-1 text-secondary/50 text-[10px] uppercase font-bold tracking-wider" onMouseEnter={clearSubMenuTimeout}>Màu nền ô</div>
          <div className="grid grid-cols-4 gap-2 px-3 pb-2 pt-1 justify-items-center" onMouseEnter={clearSubMenuTimeout}>
            {CELL_COLORS.map((c, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleApplyCellColorAt(contextCell.rowIndex, contextCell.colIndex, c.value)
                  setMenuPos(null)
                  setActiveSubmenu(null)
                }}
                title={c.name}
                style={{ backgroundColor: c.value || undefined }}
                className={`w-6 h-6 rounded-full border border-border-main relative cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center ${!c.value ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
              >
                {!c.value && <div className="w-3 h-[1px] bg-red-500 rotate-45" />}
              </button>
            ))}
          </div>

          <div className="h-[1px] bg-border-main my-1" onMouseEnter={clearSubMenuTimeout} />

          {/* Clear Table Action */}
          <button
            onClick={() => {
              handleClearTable()
              setMenuPos(null)
              setActiveSubmenu(null)
            }}
            onMouseEnter={clearSubMenuTimeout}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-500/10 text-red-500 text-[13px] transition-colors rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Xóa sạch bảng</span>
          </button>

          {/* Quản lý Cột Ẩn */}
          {table.getAllLeafColumns().some(col => !col.getIsVisible()) && (
            <>
              <div className="h-[1px] bg-border-main my-1" onMouseEnter={clearSubMenuTimeout} />
              <div className="px-3 py-1 text-secondary/50 text-[10px] uppercase font-bold tracking-wider" onMouseEnter={clearSubMenuTimeout}>Hiện lại cột bị ẩn</div>
              {table.getAllLeafColumns().map((column) => {
                if (!column.getIsVisible()) {
                  const originalColIndex = parseInt(column.id, 10)
                  const colName = column.columnDef.header as string
                  return (
                    <button
                      key={column.id}
                      onClick={() => {
                        column.toggleVisibility(true)
                        setMenuPos(null)
                        setActiveSubmenu(null)
                      }}
                      onMouseEnter={clearSubMenuTimeout}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-hover-bg text-secondary hover:text-foreground text-[13px] transition-colors rounded-lg cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-150"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
                      <span>{colName || `Cột ${originalColIndex + 1}`}</span>
                    </button>
                  )
                }
                return null
              })}
            </>
          )}
        </div>
      )}

      {/* Grid Canvas Wrapper */}
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <div className="tableWrapper relative">
          <table className="w-full" style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <colgroup>
              {activeColWidths.map((width, idx) => {
                // Chỉ render col tag cho các cột đang hiển thị
                const isVisible = columnVisibility[idx.toString()] !== false
                if (!isVisible) return null
                return <col key={idx} style={{ width: `${width}px` }} />
              })}
            </colgroup>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const col = header.column.columnDef.header as string
                    const originalColIndex = parseInt(header.column.id, 10)
                    return (
                      <th
                        key={header.id}
                        draggable={!isResizing}
                        onDragStart={(e) => handleDragStart(e, originalColIndex)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, originalColIndex)}
                        onContextMenu={(e) => handleContextMenu(e, -1, originalColIndex)}
                        style={getPinnedStyle(header.column)}
                        className="relative cursor-grab active:cursor-grabbing hover:bg-hover-bg/30 border-r border-b border-border-main"
                      >
                        <div className="flex items-center justify-between gap-1 w-full pr-4">
                          <input
                            value={col}
                            onChange={(e) => handleColumnRename(originalColIndex, e.target.value)}
                            placeholder={`Cột ${originalColIndex + 1}`}
                            className="bg-transparent border-none outline-none font-semibold text-secondary text-[12.5px] w-full placeholder:text-secondary/20"
                          />
                          {header.column.getIsSorted() && (
                            <span className="text-[10px] text-primary shrink-0 select-none">
                              {header.column.getIsSorted() === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                          {header.column.getIsPinned() && (
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-600 shrink-0 select-none">
                              📌
                            </span>
                          )}
                        </div>
                        {/* Drag resizer handle */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, originalColIndex)}
                          className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors z-20"
                          title="Kéo để thay đổi độ rộng cột"
                        />
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => (
                <tr key={row.id} className="group">
                  {row.getVisibleCells().map((cell) => {
                    const cellValue = cell.getValue() as string
                    const originalColIndex = parseInt(cell.column.id, 10)
                    const styleKey = `${rowIndex}-${originalColIndex}`
                    const cellStyle = cellStyles[styleKey] || {}
                    
                    return (
                      <td
                        key={cell.id}
                        onClick={() => setActiveCell({ rowIndex, colIndex: originalColIndex })}
                        onContextMenu={(e) => handleContextMenu(e, rowIndex, originalColIndex)}
                        style={{ ...cellStyle, ...getPinnedStyle(cell.column) }}
                        className="border-r border-b border-border-main"
                      >
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          dangerouslySetInnerHTML={{ __html: cellValue }}
                          onBlur={(e) => handleCellBlur(rowIndex, originalColIndex, e.target.innerHTML)}
                          className="outline-none min-h-[22px] w-full text-[13.5px] leading-relaxed text-foreground break-words font-normal"
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Notion style bottom caption helper */}
      <div className="text-secondary/40 text-[11px] mt-2 select-none italic text-left pl-1">
        * Kéo viền tiêu đề cột để thay đổi độ rộng. Nhấp chuột phải vào bất kỳ ô nào để thêm/xóa hàng, cột, ghim, sắp xếp và ẩn cột.
      </div>
    </div>
  )
}

export default TableEditor
