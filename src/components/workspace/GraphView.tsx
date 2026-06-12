'use client'

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { forceCollide, forceX, forceY } from 'd3-force-3d'
import { WorkspaceNode } from '@/lib/node-utils'
import { Loader2, Plus, Eraser } from 'lucide-react'
import { useClientNavigate } from '@/hooks/useClientNavigate'

const COLORS = {
  light: {
    normal: { r: 55, g: 65, b: 81 },
    active: { r: 79, g: 70, b: 229 },
    faded: { r: 229, g: 231, b: 235 }
  },
  dark: {
    normal: { r: 228, g: 228, b: 231 },
    active: { r: 129, g: 140, b: 248 },
    faded: { r: 31, g: 31, b: 35 }
  }
}

const interpolateColor = (
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  factor: number
) => {
  const r = Math.round(color1.r + (color2.r - color1.r) * factor)
  const g = Math.round(color1.g + (color2.g - color1.g) * factor)
  const b = Math.round(color1.b + (color2.b - color1.b) * factor)
  return `rgb(${r}, ${g}, ${b})`
}

interface GraphViewProps {
  nodes: WorkspaceNode[]
  loading?: boolean
  onConnectNodes?: (sourceId: string, targetId: string) => Promise<void>
  onDisconnectNodes?: (sourceId: string, targetId: string) => Promise<void>
}

// Con trỏ chuột tẩy — SVG inline encode thành data URL
const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'%3E%3Crect x='2' y='11' width='11' height='8' rx='1.5' fill='%23f87171' stroke='%23991b1b' stroke-width='1'/%3E%3Cpath d='M13 11L19 5L16 2L2 11' fill='%23fca5a5' stroke='%23991b1b' stroke-width='1' stroke-linejoin='round'/%3E%3Cline x1='2' y1='19' x2='20' y2='19' stroke='%23991b1b' stroke-width='1.2'/%3E%3C/svg%3E") 2 20, auto`

export default function GraphView({ nodes, loading, onConnectNodes, onDisconnectNodes }: GraphViewProps) {
  const { navigate } = useClientNavigate()
  const prevNodesRef = useRef<any[]>([])
  const [hoveredNode, setHoveredNode] = useState<any>(null)
  const hoveredNodeRef = useRef<any>(null)
  const [hoverProgress, setHoverProgress] = useState(0)
  const hoverProgressRef = useRef(0)
  const [isDark, setIsDark] = useState(false)
  const graphRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // ─── Connect (Shift / nút +) & Erase (E / nút tẩy) ────────────────────────
  // shiftHeld / eHeld: từ bàn phím
  const [shiftHeld, setShiftHeld] = useState(false)
  const shiftHeldRef = useRef(false)
  const [eHeld, setEHeld] = useState(false)
  const eHeldRef = useRef(false)
  // connectToggled / eraseToggled: từ nút bấm trên toolbar
  const [connectToggled, setConnectToggled] = useState(false)
  const [eraseToggled, setEraseToggled] = useState(false)
  // Kết hợp cả 2 nguồn → connectActive / eraseActive
  const connectActive = shiftHeld || connectToggled
  const eraseActive   = eHeld   || eraseToggled
  // Refs luôn fresh để dùng trong closures của ForceGraph
  const connectActiveRef = useRef(false)
  const eraseActiveRef   = useRef(false)
  useEffect(() => {
    connectActiveRef.current = connectActive
    eraseActiveRef.current   = eraseActive
  }, [connectActive, eraseActive])

  const [hoveredLink, setHoveredLink] = useState<any>(null)
  const dragSourceRef = useRef<any>(null)
  const mouseGraphPosRef = useRef<{ x: number; y: number } | null>(null)
  const [mouseGraphPos, setMouseGraphPos] = useState<{ x: number; y: number } | null>(null)
  const [dragSource, setDragSource] = useState<any>(null)
  const [connectFeedback, setConnectFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const graphDataRef = useRef<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] })

  // Đồng bộ hoveredNode vào ref (tránh stale closure)
  useEffect(() => { hoveredNodeRef.current = hoveredNode }, [hoveredNode])

  // Track Shift (connect) & E (erase) keys
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key === 'Shift' && !e.repeat) { shiftHeldRef.current = true; setShiftHeld(true) }
      if (e.key === 'e' && !e.repeat)     { eHeldRef.current = true;     setEHeld(true) }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftHeldRef.current = false
        setShiftHeld(false)
        // Huỷ drag đang dở khi nhả Shift (không huỷ nếu toggle bằng nút)
        if (!connectToggled) {
          dragSourceRef.current = null
          setDragSource(null)
          mouseGraphPosRef.current = null
          setMouseGraphPos(null)
        }
      }
      if (e.key === 'e') {
        eHeldRef.current = false
        setEHeld(false)
        if (!eraseToggled) setHoveredLink(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectToggled, eraseToggled])

  // Force-restore cursor khi active state thay đổi
  useEffect(() => {
    if (!containerRef.current) return
    if (eraseActive)   containerRef.current.style.cursor = ERASER_CURSOR
    else if (connectActive) containerRef.current.style.cursor = 'crosshair'
    else containerRef.current.style.cursor = 'default'
  }, [eraseActive, connectActive])

  // Cấu hình D3 forces
  const configureForces = useCallback((instance: any) => {
    if (!instance) return
    const chargeForce = instance.d3Force('charge')
    if (chargeForce) chargeForce.strength(-150)
    const linkForce = instance.d3Force('link')
    if (linkForce) linkForce.distance(60)
    instance.d3Force('collide', forceCollide(8))
    instance.d3Force('gravX', forceX(0).strength(0.05))
    instance.d3Force('gravY', forceY(0).strength(0.05))
  }, [])

  const setGraphRef = useCallback((instance: any) => {
    graphRef.current = instance
    configureForces(instance)
  }, [configureForces])

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width, height })
      }
    })
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Hover animation
  useEffect(() => {
    let animationFrameId: number
    const duration = 250
    const target = hoveredNode ? 1 : 0
    const startTime = performance.now()
    const startValue = hoverProgressRef.current

    const animate = (time: number) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      const nextValue = startValue + (target - startValue) * ease
      hoverProgressRef.current = nextValue
      setHoverProgress(nextValue)
      if (progress < 1) animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [hoveredNode])

  // Dark mode observer
  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'))
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Auto-hide feedback toast
  useEffect(() => {
    if (!connectFeedback) return
    const t = setTimeout(() => setConnectFeedback(null), 2500)
    return () => clearTimeout(t)
  }, [connectFeedback])

  // ─── Graph data ────────────────────────────────────────────────────────────
  const { graphData } = useMemo(() => {
    const filteredNodes = nodes.filter(n =>
      n.type === 'note' || n.type === 'map' || n.type === 'link' || n.type === 'folder'
    )

    const gNodes = filteredNodes.map(n => {
      const existingNode = prevNodesRef.current.find(pn => pn.id === n.id)
      return {
        id: n.id,
        name: n.title,
        type: n.type,
        note_id: n.note_id,
        map_id: n.map_id,
        connected_node_ids: n.connected_node_ids || [],
        x: existingNode ? existingNode.x : undefined,
        y: existingNode ? existingNode.y : undefined,
        vx: existingNode ? existingNode.vx : undefined,
        vy: existingNode ? existingNode.vy : undefined
      }
    })

    const gLinks: { source: string; target: string; type: 'hierarchy' | 'custom' }[] = []
    const processedPairs = new Set<string>()
    const filteredNodeIds = new Set(gNodes.map(n => n.id))

    filteredNodes.forEach(n => {
      if (n.parent_id && filteredNodeIds.has(n.parent_id)) {
        const pairKey = [n.id, n.parent_id].sort().join('-')
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey)
          gLinks.push({ source: n.parent_id, target: n.id, type: 'hierarchy' })
        }
      }
    })

    filteredNodes.forEach(n => {
      if (n.connected_node_ids && Array.isArray(n.connected_node_ids)) {
        n.connected_node_ids.forEach(targetId => {
          if (!filteredNodeIds.has(targetId)) return
          const pairKey = [n.id, targetId].sort().join('-')
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey)
            gLinks.push({ source: n.id, target: targetId, type: 'custom' })
          }
        })
      }
    })

    prevNodesRef.current = gNodes
    const data = { nodes: gNodes, links: gLinks }
    graphDataRef.current = data
    return { graphData: data }
  }, [nodes])

  useEffect(() => {
    const instance = graphRef.current
    if (!instance) return
    configureForces(instance)
    instance.d3ReheatSimulation()
  }, [graphData, configureForces])

  // ─── Native mouse event handlers cho Connect Mode ──────────────────────────
  // Dùng native DOM events thay vì react-force-graph drag events
  // để tránh xung đột với hệ thống kéo node mặc định của thư viện

  const getGraphCoords = useCallback((clientX: number, clientY: number) => {
    if (!graphRef.current || !containerRef.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    return graphRef.current.screen2GraphCoords(
      clientX - rect.left,
      clientY - rect.top
    )
  }, [])

  // Tìm node gần nhất với tọa độ đồ thị đã cho
  const findNodeAtGraphPos = useCallback((gx: number, gy: number, excludeId?: string) => {
    const HIT_RADIUS = 10 // Bán kính nhận diện trong không gian đồ thị
    let closest: any = null
    let closestDist = HIT_RADIUS

    graphDataRef.current.nodes.forEach((n: any) => {
      if (excludeId && n.id === excludeId) return
      const dx = (n.x ?? 0) - gx
      const dy = (n.y ?? 0) - gy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < closestDist) {
        closestDist = dist
        closest = n
      }
    })

    return closest
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Dùng { capture: true } để chặn ForceGraph TRƯỚC KHI nó xử lý sự kiện
    // Điều này quan trọng vì ForceGraph đăng ký listener ở bubble phase
    const onMouseDown = (e: MouseEvent) => {
      if (!connectActiveRef.current) return // Chỉ kích hoạt khi đang ở Connect mode
      const sourceNode = hoveredNodeRef.current
      if (!sourceNode) return

      // Chặn ForceGraph pan và drag
      e.stopImmediatePropagation()
      e.preventDefault()

      dragSourceRef.current = sourceNode
      setDragSource(sourceNode)
      const pos = getGraphCoords(e.clientX, e.clientY)
      mouseGraphPosRef.current = pos
      setMouseGraphPos(pos)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragSourceRef.current) return
      const pos = getGraphCoords(e.clientX, e.clientY)
      mouseGraphPosRef.current = pos
      setMouseGraphPos(pos ? { ...pos } : null)
    }

    const onMouseUp = async (e: MouseEvent) => {
      const source = dragSourceRef.current
      if (!source) return

      dragSourceRef.current = null
      setDragSource(null)
      mouseGraphPosRef.current = null
      setMouseGraphPos(null)

      // Ưu tiên 1: hoveredNode (react-force-graph track hover chính xác)
      let target: any = hoveredNodeRef.current
      if (target && target.id === source.id) target = null

      // Ưu tiên 2: fallback tìm theo tọa độ
      if (!target) {
        const pos = getGraphCoords(e.clientX, e.clientY)
        if (pos) target = findNodeAtGraphPos(pos.x, pos.y, source.id)
      }

      if (!target || !onConnectNodes) return

      try {
        await onConnectNodes(source.id, target.id)
        setConnectFeedback({
          message: `Đã kết nối "${source.name}" ↔ "${target.name}"`,
          type: 'success'
        })
      } catch {
        setConnectFeedback({ message: 'Tạo liên kết thất bại!', type: 'error' })
      }
    }

    // capture: true = chạy TRƯỚC khi ForceGraph nhận sự kiện
    container.addEventListener('mousedown', onMouseDown, { capture: true })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      container.removeEventListener('mousedown', onMouseDown, { capture: true })
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [getGraphCoords, findNodeAtGraphPos, onConnectNodes])

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-background relative"
    >
      {/* ── Toolbar ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <button
          onClick={() => {
            setConnectToggled(!connectToggled)
            setEraseToggled(false)
            dragSourceRef.current = null
            setDragSource(null)
            mouseGraphPosRef.current = null
            setMouseGraphPos(null)
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            connectActive 
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
              : 'bg-background border border-border-main text-secondary hover:text-foreground hover:bg-secondary/5'
          }`}
          title="Tạo liên kết (Shift)"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => {
            setEraseToggled(!eraseToggled)
            setConnectToggled(false)
            setHoveredLink(null)
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            eraseActive 
              ? 'bg-red-500 text-white shadow-md shadow-red-500/20' 
              : 'bg-background border border-border-main text-secondary hover:text-foreground hover:bg-secondary/5'
          }`}
          title="Xoá liên kết (E)"
        >
          <Eraser className="w-5 h-5" />
        </button>
      </div>

      {/* ── Tooltip: bật Connect mode + hover node → gợi ý kéo ── */}
      {connectActive && hoveredNode && !dragSource && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%',
          transform: 'translateX(-50%)', zIndex: 10,
          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: isDark ? '#1c1c22ee' : '#ffffffee',
          border: isDark ? '1px solid #4f46e5' : '1px solid #818cf8',
          color: isDark ? '#c7d2fe' : '#4338ca',
          backdropFilter: 'blur(8px)', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          Giữ chuột và kéo sang node khác để tạo liên kết
        </div>
      )}

      {/* ── Tooltip: bật Erase mode → gợi ý click vào link để xoá ── */}
      {eraseActive && !hoveredLink && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%',
          transform: 'translateX(-50%)', zIndex: 10,
          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: isDark ? '#1c1c22ee' : '#ffffffee',
          border: isDark ? '1px solid #ef4444' : '1px solid #fca5a5',
          color: isDark ? '#fca5a5' : '#991b1b',
          backdropFilter: 'blur(8px)', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          Di chuột vào đường nối → Click để xoá liên kết
        </div>
      )}
      {eraseActive && hoveredLink && (hoveredLink as any).type !== 'hierarchy' && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%',
          transform: 'translateX(-50%)', zIndex: 10,
          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: isDark ? '#450a0a' : '#fef2f2',
          border: '1.5px solid #ef4444',
          color: isDark ? '#fca5a5' : '#991b1b',
          backdropFilter: 'blur(8px)', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          🗑 Click để xoá liên kết này
        </div>
      )}
      {eraseActive && hoveredLink && (hoveredLink as any).type === 'hierarchy' && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%',
          transform: 'translateX(-50%)', zIndex: 10,
          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: isDark ? '#1c1400ee' : '#fffbebee',
          border: '1.5px solid #f59e0b',
          color: isDark ? '#fcd34d' : '#92400e',
          backdropFilter: 'blur(8px)', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          🔒 Liên kết thư mục — không thể xoá theo cách này
        </div>
      )}

      {/* ── Feedback toast ── */}
      {connectFeedback && (
        <div style={{
          position: 'absolute', bottom: 56, left: '50%',
          transform: 'translateX(-50%)', zIndex: 20,
          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: connectFeedback.type === 'success'
            ? (isDark ? '#14532d' : '#f0fdf4')
            : (isDark ? '#450a0a' : '#fef2f2'),
          border: connectFeedback.type === 'success' ? '1px solid #22c55e' : '1px solid #ef4444',
          color: connectFeedback.type === 'success'
            ? (isDark ? '#86efac' : '#166534')
            : (isDark ? '#fca5a5' : '#991b1b'),
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {connectFeedback.type === 'success' ? '✓ ' : '✗ '}{connectFeedback.message}
        </div>
      )}

      {loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-secondary/45 text-[11px] gap-2 select-none">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span>Đang tải sơ đồ liên kết...</span>
        </div>
      ) : graphData.nodes.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-secondary/50 text-xs">
          Không có dữ liệu node để hiển thị. Hãy tạo note hoặc canvas trước!
        </div>
      ) : (
        <ForceGraph2D
          ref={setGraphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel={() => ''}
          backgroundColor={isDark ? '#08080a' : '#ffffff'}

          // enableNodeDrag và enablePanInteraction luôn BẬT
          // → Shift + mousedown bị chặn bằng capture:true + stopImmediatePropagation
          // → Không cần tắt props ForceGraph (tránh re-render gây lỗi)

          nodeCanvasObject={(node: any, ctx, globalScale) => {
            let label = node.name || ''
            const MAX_LENGTH = 20
            if (label.length > MAX_LENGTH) label = label.substring(0, MAX_LENGTH) + '...'

            const palette = isDark ? COLORS.dark : COLORS.light
            let targetColor = palette.normal

            if (hoveredNode) {
              const isConnected = node.id === hoveredNode.id ||
                graphData.links.some(link => {
                  const sId = typeof link.source === 'object' ? (link.source as any).id : link.source
                  const tId = typeof link.target === 'object' ? (link.target as any).id : link.target
                  return (sId === node.id && tId === hoveredNode.id) || (sId === hoveredNode.id && tId === node.id)
                })
              targetColor = isConnected ? palette.active : palette.faded
            }

            // Highlight node nguồn đang kéo
            if (dragSource && node.id === dragSource.id) {
              targetColor = palette.active
            }

            const color = interpolateColor(palette.normal, targetColor, hoverProgress)

            // Vẽ node hình tròn
            const radius = 3
            ctx.beginPath()
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false)
            ctx.fillStyle = color
            ctx.fill()

            // Vẽ vòng viền khi là node nguồn đang kéo
            if (dragSource && node.id === dragSource.id) {
              ctx.beginPath()
              ctx.arc(node.x, node.y, radius + 2.5 / globalScale, 0, 2 * Math.PI, false)
              ctx.strokeStyle = isDark ? '#818cf8' : '#4f46e5'
              ctx.lineWidth = 1.2 / globalScale
              ctx.globalAlpha = 0.6
              ctx.stroke()
              ctx.globalAlpha = 1
            }

            // Vẽ đường rubber-band từ node nguồn đến vị trí chuột
            if (dragSource && node.id === dragSource.id && mouseGraphPos) {
              ctx.save()
              ctx.beginPath()
              ctx.moveTo(node.x, node.y)
              ctx.lineTo(mouseGraphPos.x, mouseGraphPos.y)
              ctx.strokeStyle = isDark ? '#818cf8' : '#4f46e5'
              ctx.lineWidth = 1.5 / globalScale
              ctx.setLineDash([4 / globalScale, 4 / globalScale])
              ctx.globalAlpha = 0.9
              ctx.stroke()
              ctx.restore()

              // Vẽ chấm tròn tại đầu chuột
              ctx.save()
              ctx.beginPath()
              ctx.arc(mouseGraphPos.x, mouseGraphPos.y, 3 / globalScale, 0, 2 * Math.PI)
              ctx.fillStyle = isDark ? '#818cf8' : '#4f46e5'
              ctx.globalAlpha = 0.8
              ctx.fill()
              ctx.restore()
            }

            // Label khi zoom đủ gần
            if (globalScale >= 1.0) {
              ctx.save()
              const m = ctx.getTransform?.()
              const screenFontSize = 8 + 4 * globalScale
              const TEXT_GAP_PX = 8
              const dpi = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

              if (m) {
                ctx.setTransform(1, 0, 0, 1, 0, 0)
                ctx.font = `${screenFontSize * dpi}px Inter, sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'top'
                ctx.fillStyle = color
                const physicalRadius = radius * Math.abs(m.d)
                const physicalGap = TEXT_GAP_PX * dpi
                const physicalY = node.y * m.d + m.f + physicalRadius + physicalGap
                ctx.fillText(label, node.x * m.a + m.e, physicalY)
              } else {
                ctx.font = `${screenFontSize / globalScale}px Inter, sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'top'
                ctx.fillStyle = color
                ctx.fillText(label, node.x, node.y + radius + TEXT_GAP_PX / globalScale)
              }
              ctx.restore()
            }
          }}

          linkColor={link => {
            const l = link as any
            const defaultColorStr = isDark ? '#3f3f46' : '#d1d5db'

            // Erase mode: phân biệt rõ link có thể xoá vs link được bảo vệ
            if (eraseActive) {
              if (hoveredLink && l === hoveredLink) {
                // Đường phân cấp (folder→child): màu vàng cam cảnh báo — KHÔNG xoá được
                if (l.type === 'hierarchy') return '#f59e0b'
                // Đường custom: màu đỏ — có thể xoá
                return '#ef4444'
              }
              return isDark ? '#27272a' : '#f4f4f5'
            }

            if (hoverProgress < 0.001) return defaultColorStr
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source
            const targetId = typeof l.target === 'object' ? l.target.id : l.target
            const palette = isDark ? COLORS.dark : COLORS.light
            const normalRGB = isDark ? { r: 63, g: 63, b: 70 } : { r: 209, g: 213, b: 219 }

            let targetRGB = normalRGB
            if (hoveredNode) {
              if (sourceId === hoveredNode.id || targetId === hoveredNode.id) {
                targetRGB = palette.active
              } else {
                targetRGB = isDark ? { r: 24, g: 24, b: 27 } : { r: 243, g: 244, b: 246 }
              }
            }
            return interpolateColor(normalRGB, targetRGB, hoverProgress)
          }}

          linkWidth={link => {
            const l = link as any
            // Erase mode: chỉ làm dày link custom (có thể xoá), KHÔNG làm dày hierarchy
            if (eraseActive && hoveredLink && l === hoveredLink && l.type !== 'hierarchy') return 3
            if (hoveredNode) {
              const sourceId = typeof l.source === 'object' ? l.source.id : l.source
              const targetId = typeof l.target === 'object' ? l.target.id : l.target
              if (sourceId === hoveredNode.id || targetId === hoveredNode.id) return 2
            }
            return 1.2
          }}

          // Tăng vùng nhận diện hover của link lên 4px (mặc định = 1)
          linkHoverPrecision={4}

          onLinkHover={link => setHoveredLink(link)}

          onLinkClick={async link => {
            if (!eraseActiveRef.current || !onDisconnectNodes) return
            const l = link as any
            // Chỉ cho phép xoá custom links, không xoá hierarchy (parent_id)
            if (l.type === 'hierarchy') return
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source
            const targetId = typeof l.target === 'object' ? l.target.id : l.target
            try {
              await onDisconnectNodes(sourceId, targetId)
              setConnectFeedback({ message: 'Đã xoá liên kết', type: 'success' })
            } catch {
              setConnectFeedback({ message: 'Xoá liên kết thất bại!', type: 'error' })
            }
          }}

          onNodeHover={node => {
            setHoveredNode(node)
            if (!containerRef.current) return
            // Dùng REF (không dùng state) — tránh stale closure khi ForceGraph gọi callback này
            if (eraseActiveRef.current) {
              containerRef.current.style.cursor = ERASER_CURSOR
            } else if (connectActiveRef.current) {
              containerRef.current.style.cursor = 'crosshair'
            } else {
              containerRef.current.style.cursor = node ? 'pointer' : 'default'
            }
          }}

          onNodeClick={node => {
            if (connectActiveRef.current || eraseActiveRef.current) return
            if (node.type === 'note' && node.note_id) navigate(`/note/${node.note_id}`)
            else if (node.type === 'map' && node.map_id) navigate(`/canvas/${node.map_id}`)
            else if (node.type === 'link') navigate(`/link/${node.id}`)
          }}

          warmupTicks={150}
          d3AlphaDecay={0.015}
          d3VelocityDecay={0.3}
          onEngineStop={() => {
            if (graphRef.current) graphRef.current.zoomToFit(400, 50)
          }}
        />
      )}
    </div>
  )
}
