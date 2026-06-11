'use client'

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { forceCollide, forceX, forceY } from 'd3-force-3d'
import { WorkspaceNode } from '@/lib/node-utils'
import { Loader2 } from 'lucide-react'
import { useClientNavigate } from '@/hooks/useClientNavigate'

const STANDARD_FONT_SIZE = 13

const COLORS = {
  light: {
    normal: { r: 55, g: 65, b: 81 },      // #374151
    active: { r: 79, g: 70, b: 229 },     // #4F46E5
    faded: { r: 229, g: 231, b: 235 }     // #E5E7EB
  },
  dark: {
    normal: { r: 228, g: 228, b: 231 },   // #e4e4e7
    active: { r: 129, g: 140, b: 248 },   // #818cf8
    faded: { r: 31, g: 31, b: 35 }        // #1f1f23
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
}

export default function GraphView({ nodes, loading }: GraphViewProps) {
  const { navigate } = useClientNavigate()
  const prevNodesRef = useRef<any[]>([])
  const [hoveredNode, setHoveredNode] = useState<any>(null)
  const [hoverProgress, setHoverProgress] = useState(0)
  const hoverProgressRef = useRef(0) // Ref để tránh stale closure trong animation
  const [isDark, setIsDark] = useState(false)
  const graphRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Cấu hình các lực D3 — theo kiến trúc Obsidian:
  // Lực đẩy mạnh (charge) = cơ chế spacing chính, KHÔNG phải forceCollide
  // forceCollide chỉ dùng để ngăn dot-on-dot overlap
  const configureForces = useCallback((instance: any) => {
    if (!instance) return

    // Lực đẩy mạnh: cơ chế tạo khoảng cách tự nhiên giữa các node
    // Tương đương "Repel force" slider của Obsidian ở mức cao
    const chargeForce = instance.d3Force('charge')
    if (chargeForce) chargeForce.strength(-150)

    // Khoảng cách link vừa phải: các node có kết nối tụ thành cluster
    const linkForce = instance.d3Force('link')
    if (linkForce) linkForce.distance(60)

    // Collision CỰC NHỎ: chỉ ngăn dot chồng lên nhau (r=3 + 5 buffer)
    // Text label KHÔNG được dùng ở đây vì chúng vẽ ở screen space, không graph space
    instance.d3Force('collide', forceCollide(8))

    // Lực hấp dẫn nhẹ về trung tâm: giữ node rời rạc không trôi ra ngoài viewport
    instance.d3Force('gravX', forceX(0).strength(0.05))
    instance.d3Force('gravY', forceY(0).strength(0.05))
  }, [])

  // Callback ref: cấu hình forces ngay khi component mount (trước warmupTicks)
  const setGraphRef = useCallback((instance: any) => {
    graphRef.current = instance
    configureForces(instance)
  }, [configureForces])

  // Đo đạc kích thước thực tế của parent container bằng ResizeObserver để tránh tràn màn hình sang phải
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

  // Hoạt ảnh chuyển đổi mượt mà khi hover thay đổi
  useEffect(() => {
    let animationFrameId: number
    const duration = 250 // Hoạt ảnh diễn ra trong 250ms
    const target = hoveredNode ? 1 : 0
    
    const startTime = performance.now()
    const startValue = hoverProgressRef.current // Đọc từ ref để tránh stale closure
    
    const animate = (time: number) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing: easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const nextValue = startValue + (target - startValue) * ease
      
      hoverProgressRef.current = nextValue // Cập nhật ref trước khi set state
      setHoverProgress(nextValue)
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }
    
    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [hoveredNode])

  // Theo dõi đổi theme tự động
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  // 1. Xử lý dữ liệu đồ thị (Bao gồm Note, Canvas/Map, Link, và Folder)
  const { graphData } = useMemo(() => {
    const filteredNodes = nodes.filter(n => n.type === 'note' || n.type === 'map' || n.type === 'link' || n.type === 'folder')

    const gNodes = filteredNodes.map(n => {
      // Tìm xem node này đã tồn tại trong prevNodes chưa để tái sử dụng tọa độ & vận tốc của D3
      const existingNode = prevNodesRef.current.find(pn => pn.id === n.id);
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
      };
    })

    // Tạo danh sách Links cho đồ thị (Tránh lặp lại kết nối hai chiều)
    const gLinks: { source: string; target: string; type: 'hierarchy' | 'custom' }[] = []
    const processedPairs = new Set<string>()
    const filteredNodeIds = new Set(gNodes.map(n => n.id))

    // Thêm liên kết thư mục phân cấp (nối các node con với thư mục cha)
    filteredNodes.forEach(n => {
      if (n.parent_id && filteredNodeIds.has(n.parent_id)) {
        const pairKey = [n.id, n.parent_id].sort().join('-')
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey)
          gLinks.push({
            source: n.parent_id,
            target: n.id,
            type: 'hierarchy'
          })
        }
      }
    })

    // Thêm các kết nối thủ công (custom links) giữa các node
    filteredNodes.forEach(n => {
      if (n.connected_node_ids && Array.isArray(n.connected_node_ids)) {
        n.connected_node_ids.forEach(targetId => {
          // Chỉ thêm link nếu cả source và target đều tồn tại trong filtered nodes
          if (!filteredNodeIds.has(targetId)) return
          const pairKey = [n.id, targetId].sort().join('-')
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey)
            gLinks.push({
              source: n.id,
              target: targetId,
              type: 'custom'
            })
          }
        })
      }
    })

    // Lưu lại danh sách node hiện tại vào ref để dùng cho lần sau
    prevNodesRef.current = gNodes;

    return { 
      graphData: { nodes: gNodes, links: gLinks }
    }
  }, [nodes])

  // Khi dữ liệu thay đổi: cấu hình lại lực và hâm nóng simulation
  useEffect(() => {
    const instance = graphRef.current
    if (!instance) return
    configureForces(instance)
    instance.d3ReheatSimulation()
  }, [graphData, configureForces])

  return (
    <div ref={containerRef} className="w-full h-full bg-background relative">
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
          
          // Tự vẽ Node và Chữ (Vẽ Canvas)
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            let label = node.name || '';
            const MAX_LENGTH = 20;
            if (label.length > MAX_LENGTH) {
              label = label.substring(0, MAX_LENGTH) + '...';
            }
            
            const palette = isDark ? COLORS.dark : COLORS.light;
            let targetColor = palette.normal;
            
            if (hoveredNode) {
              const isConnected = node.id === hoveredNode.id || 
                                  graphData.links.some(link => {
                                    const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
                                    const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;
                                    return (sId === node.id && tId === hoveredNode.id) || (sId === hoveredNode.id && tId === node.id);
                                  });
              
              targetColor = isConnected ? palette.active : palette.faded;
            }
            
            const color = interpolateColor(palette.normal, targetColor, hoverProgress);
            
            // Vẽ hình tròn (Kích thước to gấp đôi, bán kính r=3)
            const radius = 3; 
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
            
            // Chỉ hiện label khi zoom ĐỦ GẦN (globalScale >= 1.0)
            // Giống Obsidian: zoom xa = chỉ thấy dot, zoom gần = thấy text
            // Đây là cách đúng để tránh text overlap ở overview
            if (globalScale >= 1.0) {
              ctx.save();
              const m = ctx.getTransform?.();
              
              // Tính font size động theo tỉ lệ zoom để không bị quá to so với node
              const screenFontSize = 8 + 4 * globalScale;
              const TEXT_GAP_PX = 8; // Khoảng cách cố định bằng pixel trên màn hình giữa node và chữ
              const dpi = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
              
              if (m) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.font = `${screenFontSize * dpi}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = color;
                
                // m.d chứa cả tỷ lệ zoom (globalScale) lẫn mật độ điểm ảnh (devicePixelRatio)
                // Ta tính toán hoàn toàn theo tọa độ pixel vật lý (physical pixels) trên canvas để chính xác 100%
                const physicalRadius = radius * Math.abs(m.d);
                const physicalGap = TEXT_GAP_PX * dpi;
                const physicalY = node.y * m.d + m.f + physicalRadius + physicalGap;
                
                ctx.fillText(label, node.x * m.a + m.e, physicalY);
              } else {
                ctx.font = `${screenFontSize / globalScale}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = color;
                ctx.fillText(label, node.x, node.y + radius + TEXT_GAP_PX / globalScale);
              }
              ctx.restore();
            }
          }}
          
          linkColor={link => {
            const l = link as any
            const defaultColorStr = isDark ? '#3f3f46' : '#d1d5db';
            
            if (hoverProgress < 0.001) return defaultColorStr;
            
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            
            const palette = isDark ? COLORS.dark : COLORS.light;
            const normalRGB = isDark ? { r: 63, g: 63, b: 70 } : { r: 209, g: 213, b: 219 };
            
            let targetRGB = normalRGB;
            if (hoveredNode) {
              if (sourceId === hoveredNode.id || targetId === hoveredNode.id) {
                targetRGB = palette.active; // Active Indigo
              } else {
                targetRGB = isDark ? { r: 24, g: 24, b: 27 } : { r: 243, g: 244, b: 246 }; // Muted background color
              }
            }
            
            return interpolateColor(normalRGB, targetRGB, hoverProgress);
          }}
          
          linkWidth={link => {
            const l = link as any
            if (hoveredNode) {
              const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
              const targetId = typeof l.target === 'object' ? l.target.id : l.target;
              if (sourceId === hoveredNode.id || targetId === hoveredNode.id) {
                return 2; // Làm nổi bật đường kết nối khi hover node
              }
            }
            return 1.2; // Độ dày mặc định rõ hơn một chút so với mặc định 1
          }}
          
          onNodeHover={node => {
            setHoveredNode(node)
            if (containerRef.current) {
              containerRef.current.style.cursor = node ? 'pointer' : 'default'
            }
          }}
          onNodeClick={node => {
            if (node.type === 'note' && node.note_id) {
              navigate(`/note/${node.note_id}`)
            } else if (node.type === 'map' && node.map_id) {
              navigate(`/canvas/${node.map_id}`)
            } else if (node.type === 'link') {
              navigate(`/link/${node.id}`)
            }
          }}
          // warmupTicks: pre-run 150 iterations TRƯỚC khi render frame đầu tiên
          // → nodes đã ở vị trí tốt ngay từ đầu, không bị "nhảy" lộn xộn
          warmupTicks={150}
          // alphaDecay thấp hơn: simulation nguội chậm hơn = layout tốt hơn
          d3AlphaDecay={0.015}
          d3VelocityDecay={0.3}
          // Sau khi simulation ổn định → auto zoom vừa khung hình
          onEngineStop={() => {
            if (graphRef.current) {
              graphRef.current.zoomToFit(400, 50)
            }
          }}
        />
      )}
    </div>
  )
}
