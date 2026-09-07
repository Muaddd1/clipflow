'use client'

import { DataProvider } from '@/lib/data-context'
import { ToastProvider } from '@/lib/toast-context'
import { Sidebar, MobileNav } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useData } from '@/lib/data-context'

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <ToastProvider>
        <ShellInner>{children}</ShellInner>
      </ToastProvider>
    </DataProvider>
  )
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data } = useData()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!mounted) return null

  if (pathname === '/onboarding') {
    return <>{children}</>
  }

  return (
    <div className={cn('min-h-screen bg-background', data.settings.theme === 'light' ? 'light-theme' : '')}>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div className={cn(
        'fixed top-0 left-0 h-screen z-40 transition-transform duration-300 md:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar mobile onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block fixed top-0 left-0 h-screen z-30">
        <Sidebar />
      </div>

      {/* Content area — ml-[240px] on desktop, ml-0 on mobile */}
      <div className={cn('transition-all duration-300', 'ml-0 md:ml-[240px]')}>
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6 pb-24 md:pb-6 pt-20">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
