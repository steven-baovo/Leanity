'use client'

import React, { Suspense, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

import { useAppRouter } from '@/contexts/AppRouterContext'
import { useLocalWorkspace } from '@/lib/local-first/useLocalWorkspace'
import { triggerSync } from '@/lib/local-first/sync-engine'
import { db } from '@/lib/local-first/db'
import { ReactFlowProvider } from '@xyflow/react'

// Tasks module
import IssueList from '@/components/issues/IssueList'
import IssueDetails from '@/components/issues/IssueDetails'
import ProjectList from '@/components/projects/ProjectList'
import ProjectDetails from '@/components/projects/ProjectDetails'
import CycleList from '@/components/cycles/CycleList'
import CycleDetails from '@/components/cycles/CycleDetails'

// Workspace module
import NoteEditorClient from '@/components/mindnote/NoteEditorClient'
import TableEditorClient from '@/components/mindnote/TableEditorClient'
import WorkspaceHome from '@/components/workspace/WorkspaceHome'
import ConnectNodeModal from '@/components/workspace/ConnectNodeModal'
import LinkEmbedPreview from '@/components/workspace/LinkEmbedPreview'
import MindmapBoard from '@/components/mindmap/MindmapBoard'

// Other modules
import OKRView from '@/components/okrs/OKRView'
import FocusTimer from '@/components/focus/FocusTimer'
import FocusSettings from '@/components/focus/FocusSettings'
import ProductivityReport from '@/components/productivity/ProductivityReport'

// Dynamic import cho GraphView (heavy, ssr: false)
const GraphView = dynamic(() => import('@/components/workspace/GraphView'), {
  ssr: false,
  loading: () => (
    <div className="text-xs text-secondary/50 flex-1 flex items-center justify-center">
      Đang tải Graph View...
    </div>
  ),
})

// ─── Workspace View (quản lý sync + modal) ────────────────────────────────────

function WorkspaceView({ id, type }: { id: string | null; type: string }) {
  const { nodes, updateNode, liveNodesReady } = useLocalWorkspace()
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    async function syncOnMount() {
      const count = await db.workspace_nodes.count()
      if (count === 0) {
        await triggerSync()
      } else {
        timer = setTimeout(() => { triggerSync() }, 2000)
      }
    }
    syncOnMount()
    return () => { if (timer) clearTimeout(timer) }
  }, [])

  if (type === 'note' && id) {
    return (
      <div className="w-full h-full relative overflow-hidden no-scrollbar">
        <NoteEditorClient
          key={id}
          noteId={id}
          onOpenConnectModal={() => setIsConnectModalOpen(true)}
        />
        <ConnectNodeModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          nodes={nodes}
          onSelect={async (targetId) => {
            const currentNode = nodes.find(n => n.note_id === id)
            if (!currentNode) { alert('Không tìm thấy node hiện tại!'); return }
            const currentConnections = currentNode.connected_node_ids || []
            if (currentConnections.includes(targetId)) { alert('Node này đã được kết nối!'); return }
            const updatedConnections = [...currentConnections, targetId]
            const { error: errorA } = await updateNode(currentNode.id, { connected_node_ids: updatedConnections })
            if (errorA) { alert(`Lỗi: ${errorA}`); return }
            const targetNode = nodes.find(n => n.id === targetId)
            if (targetNode) {
              const targetConnections = targetNode.connected_node_ids || []
              if (!targetConnections.includes(currentNode.id)) {
                await updateNode(targetId, { connected_node_ids: [...targetConnections, currentNode.id] })
              }
            }
            alert('Đã tạo kết nối 2 chiều!')
            setIsConnectModalOpen(false)
          }}
          currentNodeId={nodes.find(n => n.note_id === id)?.id || ''}
          alreadyConnectedIds={nodes.find(n => n.note_id === id)?.connected_node_ids || []}
        />
      </div>
    )
  }

  if (type === 'table' && id) {
    return (
      <div className="w-full h-full relative overflow-hidden no-scrollbar">
        <TableEditorClient
          key={id}
          noteId={id}
          onOpenConnectModal={() => setIsConnectModalOpen(true)}
        />
        <ConnectNodeModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          nodes={nodes}
          onSelect={async (targetId) => {
            const currentNode = nodes.find(n => n.note_id === id)
            if (!currentNode) { alert('Không tìm thấy node hiện tại!'); return }
            const currentConnections = currentNode.connected_node_ids || []
            if (currentConnections.includes(targetId)) { alert('Node này đã được kết nối!'); return }
            const updatedConnections = [...currentConnections, targetId]
            const { error: errorA } = await updateNode(currentNode.id, { connected_node_ids: updatedConnections })
            if (errorA) { alert(`Lỗi: ${errorA}`); return }
            const targetNode = nodes.find(n => n.id === targetId)
            if (targetNode) {
              const targetConnections = targetNode.connected_node_ids || []
              if (!targetConnections.includes(currentNode.id)) {
                await updateNode(targetId, { connected_node_ids: [...targetConnections, currentNode.id] })
              }
            }
            alert('Đã tạo kết nối 2 chiều!')
            setIsConnectModalOpen(false)
          }}
          currentNodeId={nodes.find(n => n.note_id === id)?.id || ''}
          alreadyConnectedIds={nodes.find(n => n.note_id === id)?.connected_node_ids || []}
        />
      </div>
    )
  }

  if (type === 'canvas' && id) {
    return (
      <div className="w-full h-full relative">
        <ReactFlowProvider>
          <MindmapBoard mindmapId={id} />
        </ReactFlowProvider>
      </div>
    )
  }

  if (type === 'link' && id) {
    return (
      <div className="w-full h-full relative">
        <LinkEmbedPreview nodeId={id} nodes={nodes} />
      </div>
    )
  }

  if (type === 'graph') {
    return (
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
        <header className="flex items-center justify-between px-4 h-[44px] border-b border-border-main shrink-0 bg-background select-none">
          <div className="flex items-center gap-1.5 text-[13px] tracking-tight font-medium text-secondary capitalize">
            <span>library</span>
            <span className="text-zinc-400 dark:text-zinc-600">/</span>
            <span className="text-foreground">graph view</span>
          </div>
        </header>
        <div className="flex-1 min-h-0 relative">
          <GraphView
            nodes={nodes}
            loading={!liveNodesReady}
            onConnectNodes={async (sourceId, targetId) => {
              const sourceNode = nodes.find(n => n.id === sourceId)
              const targetNode = nodes.find(n => n.id === targetId)
              if (!sourceNode || !targetNode) return

              const sourceConnections = sourceNode.connected_node_ids || []
              const targetConnections = targetNode.connected_node_ids || []

              // Tránh tạo liên kết trùng lặp
              if (!sourceConnections.includes(targetId)) {
                await updateNode(sourceId, { connected_node_ids: [...sourceConnections, targetId] })
              }
              if (!targetConnections.includes(sourceId)) {
                await updateNode(targetId, { connected_node_ids: [...targetConnections, sourceId] })
              }
            }}
            onDisconnectNodes={async (sourceId, targetId) => {
              const sourceNode = nodes.find(n => n.id === sourceId)
              const targetNode = nodes.find(n => n.id === targetId)
              // Xoá 2 chiều — nhất quán với handleRemoveLink trong Note/Canvas
              if (sourceNode?.connected_node_ids) {
                await updateNode(sourceId, {
                  connected_node_ids: sourceNode.connected_node_ids.filter(id => id !== targetId)
                })
              }
              if (targetNode?.connected_node_ids) {
                await updateNode(targetId, {
                  connected_node_ids: targetNode.connected_node_ids.filter(id => id !== sourceId)
                })
              }
            }}
          />
        </div>
      </div>
    )
  }

  // Default: WorkspaceHome
  return (
    <WorkspaceHome />
  )
}

// ─── Main Router ──────────────────────────────────────────────────────────────

function RouterContent() {
  const { route } = useAppRouter()
  const { type, id } = route

  // Tasks module
  if (type === 'task' && id)     return <IssueDetails issueId={id} />
  if (type === 'project' && id)  return <ProjectDetails projectId={id} />
  if (type === 'cycle' && id)    return <CycleDetails cycleId={id} />
  if (type === 'projects')       return <ProjectList />
  if (type === 'cycles')         return <CycleList />
  if (type === 'tasks')          return <IssueList />

  // Workspace module
  if (type === 'note')    return <WorkspaceView id={id} type="note" />
  if (type === 'table')   return <WorkspaceView id={id} type="table" />
  if (type === 'canvas')  return <WorkspaceView id={id} type="canvas" />
  if (type === 'link')    return <WorkspaceView id={id} type="link" />
  if (type === 'graph')   return <WorkspaceView id={null} type="graph" />
  if (type === 'workspace') return <WorkspaceView id={null} type="workspace" />

  // Other modules
  if (type === 'okrs')         return <OKRView />
  if (type === 'productivity') return <ProductivityReport />
  if (type === 'pomodoro') return (
    <main className="w-full h-full flex flex-col bg-background p-4 sm:p-6 lg:p-8 relative overflow-hidden justify-center items-center">
      <div className="w-full max-w-xl flex items-center justify-between gap-4 mb-4 sm:mb-6 relative z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-sm rotate-45" />
          </div>
          <h1 className="text-sm sm:text-lg font-black text-foreground tracking-tighter uppercase whitespace-nowrap">MindFocus</h1>
        </div>
        <FocusSettings />
      </div>
      <div className="w-full max-w-xl flex-1 flex flex-col justify-center min-h-0 relative z-10">
        <FocusTimer />
      </div>
    </main>
  )

  // Default
  return <IssueList />
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function ClientRouter() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <RouterContent />
    </Suspense>
  )
}
