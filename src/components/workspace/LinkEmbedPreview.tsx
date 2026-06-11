'use client'

import { useState, useEffect, useMemo } from 'react'
import { WorkspaceNode } from '@/lib/local-first/db'
import { checkUrlEmbeddable } from '@/app/actions'
import { Link as LucideLink, ShieldAlert, ExternalLink, Loader2 } from 'lucide-react'

export default function LinkEmbedPreview({ nodeId, nodes }: { nodeId: string; nodes: WorkspaceNode[] }) {
  const node = nodes.find(n => n.id === nodeId)
  const [iframeKey, setIframeKey] = useState(0)
  const [isChecking, setIsChecking] = useState(true)
  const [isEmbeddable, setIsEmbeddable] = useState<boolean | null>(null)
  const [forceEmbed, setForceEmbed] = useState(false)

  let formattedUrl = node?.url || ''
  if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://') && !formattedUrl.startsWith('/')) {
    formattedUrl = `https://${formattedUrl}`
  }

  useEffect(() => {
    if (!formattedUrl) { setIsChecking(false); setIsEmbeddable(null); return }
    setIsChecking(true)
    setIsEmbeddable(null)
    setForceEmbed(false)
    checkUrlEmbeddable(formattedUrl)
      .then(({ embeddable }) => { setIsEmbeddable(embeddable); setIsChecking(false) })
      .catch(() => { setIsEmbeddable(false); setIsChecking(false) })
  }, [formattedUrl, iframeKey])

  const hostName = useMemo(() => {
    try {
      if (!formattedUrl) return ''
      return new URL(formattedUrl).hostname
    } catch { return formattedUrl }
  }, [formattedUrl])

  const handleRefresh = () => setIframeKey(prev => prev + 1)
  const handleOpenNewTab = () => { if (formattedUrl) window.open(formattedUrl, '_blank') }

  if (!node) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-secondary/40 text-xs gap-2">
        <span>Không tìm thấy thông tin liên kết này</span>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <div className="flex-1 relative flex flex-col min-h-0">
        {!formattedUrl ? (
          <div className="flex-1 m-4 p-6 bg-surface border border-border-main rounded-2xl flex flex-col items-center justify-center text-center">
            <LucideLink className="w-10 h-10 text-secondary/30 mb-2 animate-bounce" />
            <h3 className="text-sm font-bold text-foreground mb-1">Chưa có liên kết URL</h3>
            <p className="text-xs text-secondary/50 max-w-sm mb-4">
              Nhấp chuột phải vào tên liên kết này ở thanh bên, chọn &ldquo;Sửa tiêu đề &amp; URL Link&rdquo; để thêm địa chỉ web.
            </p>
          </div>
        ) : isChecking ? (
          <div className="flex-1 m-4 p-6 bg-surface border border-border-main rounded-2xl flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <h3 className="text-sm font-bold text-foreground mb-1">Đang kiểm tra bảo mật trang web...</h3>
            <p className="text-xs text-secondary/40 max-w-xs">Xác minh khả năng hiển thị trực tiếp để mang lại trải nghiệm tối ưu.</p>
          </div>
        ) : (isEmbeddable || forceEmbed) ? (
          <div
            className="flex-1 bg-surface overflow-hidden flex flex-col relative"
            style={{ overscrollBehavior: 'contain' }}
          >
            <div className="absolute top-3 right-3 z-50 flex items-center gap-1.5">
              <button
                onClick={handleRefresh}
                className="p-2 bg-surface/80 backdrop-blur-md hover:bg-surface text-secondary/70 hover:text-foreground border border-border-main rounded-xl transition-all duration-150 cursor-pointer"
                title="Tải lại trang"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                </svg>
              </button>
              <button
                onClick={handleOpenNewTab}
                className="flex items-center gap-0 hover:gap-1.5 px-2 py-2 hover:px-3 bg-surface/80 backdrop-blur-md hover:bg-surface text-secondary/70 hover:text-primary border border-border-main rounded-xl transition-all duration-300 ease-in-out cursor-pointer group"
                title="Mở trong tab mới"
              >
                <ExternalLink className="w-3.5 h-3.5 text-secondary/70 group-hover:text-primary transition-colors" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-bold text-primary transition-all duration-300 ease-in-out group-hover:max-w-[80px]">
                  Mở tab mới
                </span>
              </button>
            </div>
            <iframe
              key={iframeKey}
              src={formattedUrl}
              className="flex-1 w-full border-none bg-surface block"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              title={node.title}
              style={{ overscrollBehavior: 'contain' }}
            />
          </div>
        ) : (
          <div className="flex-1 m-4 bg-surface border border-border-main rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-surface to-active-bg/30">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-5 border border-amber-500/20 animate-pulse">
              <ShieldAlert className="w-8 h-8 text-amber-500" strokeWidth={1.8} />
            </div>
            <h3 className="text-base font-extrabold text-foreground mb-2">Không thể xem trực tiếp trang web</h3>
            <p className="text-xs text-secondary/60 max-w-md leading-relaxed mb-6">
              Để bảo vệ quyền riêng tư, trang web <strong className="text-foreground font-bold">{hostName}</strong> từ chối hiển thị nội dung bên trong các ứng dụng khác.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <button
                onClick={handleOpenNewTab}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-primary hover:bg-primary/95 rounded-xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
              >
                <span>Mở trong tab mới</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setForceEmbed(true)}
                className="w-full sm:w-auto px-4 py-3 text-xs font-semibold text-foreground hover:bg-hover-bg rounded-xl transition-all duration-150 border border-border-main cursor-pointer"
              >
                Vẫn cố thử nhúng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
