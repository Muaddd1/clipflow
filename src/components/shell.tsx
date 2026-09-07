'use client'

import { DataProvider } from '@/lib/data-context'
import { ToastProvider } from '@/lib/toast-context'
import { Sidebar, MobileNav } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { usePathname } from 'next/navigation'
import { useEffect, useState, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

interface ShellContextValue {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const ShellContext = createContext<ShellContextValue>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
})

export function useShell() {
  return useContext(ShellContext)
}

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
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Keyboard shortcut for search
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Trigger search open — handled in TopBar
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!mounted) return null

  // Onboarding page doesn't have the shell
  if (pathname === '/onboarding') {
    return <>{children}</>
  }

  return (
    <ShellContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="min-h-screen bg-background">
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar: hidden on mobile, fixed on desktop */}
        <div className={cn(
          'fixed top-0 left-0 h-screen z-40 transition-transform duration-300 md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <Sidebar mobile onClose={() => setSidebarOpen(false)} />
        </div>
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className={cn('transition-all duration-300 ml-0 md:ml-[240px]')}>
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-6 pb-24 md:pb-6">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </ShellContext.Provider>
  )
}
