'use client'

import { usePathname } from 'next/navigation'

export default function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden relative bg-surface border border-border-main lg:rounded-none lg:border-y-0 lg:border-r-0 lg:border-l`}>
      <main className="flex-1 min-w-0 overflow-y-auto no-scrollbar relative">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
